/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../flow',
   'angular-mocks',
   '../../../event_bus/event_bus',
   '../../../testing/portal_mocks',
   '../../../utilities/object',
   '../../../logging/log',
   '../../paths',
   './spec_data',
   '../portal_services'
], function( flowModule, angularMocks, EventBus, portalMocks, object, log, pathsMock, testData ) {
   'use strict';

   describe( 'A flow module', function() {

      var q_;
      var runBlock;
      var windowMock_;
      var pageControllerMock_;

      beforeEach( function() {
         pathsMock.FLOW_JSON = '/application/flow/flow.json';
         pathsMock.PAGES = '/application/pages/';
         pathsMock.WIDGETS = '/includes/widgets/';

         jasmine.Clock.useMock();
         q_ = portalMocks.mockQ();

         // This prevents the module from calling its run method initially.  We need a setup $httpBackend
         // before the call to run can succeed and therefore call it manually later, when everything is setup.
         runBlock = flowModule._runBlocks[0];
         flowModule._runBlocks = [];

         angularMocks.module( 'laxar.portal_services' );
         angularMocks.module( 'laxar.portal.flow' );
         angularMocks.module( function( $provide ) {
            pageControllerMock_ = {
               setupPage: jasmine.createSpy( 'pageController.setupPage' ).andCallFake( function() {
                  return q_.when();
               } ),
               tearDownPage: jasmine.createSpy( 'pageController.tearDownPage' ).andCallFake( function() {
                  return q_.when();
               } )
            };
            $provide.service( 'axPageService', function() {
               return {
                  controller: function() {
                     return pageControllerMock_;
                  }
               };
            } );
         } );

         angularMocks.module( function( $provide ) {
            windowMock_ = {
               laxar: {},
               location: { reload: jasmine.createSpy( 'reloadSpy' ) },
               navigator: window.navigator
            };
            for( var key in location ) {
               if( key !== 'reload' ) {
                  windowMock_.location[ key ] = location[ key ];
               }
            }
            $provide.value( '$window', windowMock_ );
            $provide.value( 'Configuration', {
               get: function( key, optionalDefault ) {
                  return object.path( windowMock_.laxar, key, optionalDefault );
               }
            } );

         } );
      } );

      function asFileResource( resource ) {
         return JSON.stringify( resource );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         flowModule._runBlocks = [ runBlock ];
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when bootstrapped', function() {

         var $httpBackend;
         var $injector;

         beforeEach( angularMocks.inject( function( _$injector_, _$rootScope_ ) {
            $injector = _$injector_;
            $httpBackend = $injector.get( '$httpBackend' );
         } ) );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'loads the flow data', angularMocks.inject( function( $route ) {
            $httpBackend.expectGET( testData.urls.flow ).respond( asFileResource( testData.flow ) );

            $injector.invoke( runBlock );
            $httpBackend.flush();
         } ) );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the flow data was loaded', function() {

            var $route;

            beforeEach( angularMocks.inject( function( _$route_ ) {
               $route = _$route_;
               spyOn( $route, 'reload' );

               object.setPath( windowMock_.laxar, 'portal.flow.entryPoint', {
                  target: 'myEntry2',
                  parameters: {
                     taskId: 'abc123',
                     // for everything apart from / we can rely on angular js to do the encoding
                     anotherThing: 'test/url/encoding'
                  }
               } );

               $httpBackend.whenGET( testData.urls.flow ).respond( asFileResource( testData.flow ) );

               $injector.invoke( runBlock );
               $httpBackend.flush();
            } ) );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'reloads the current route', function() {
               expect( $route.reload ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'assembles all routes', function() {
               var routes = [ '/entry',
                  '/stepOne', '/stepOne/:taskId',
                  '/stepTwo', '/stepTwo/:taskId', '/stepTwo/:taskId/:anotherThing',
                  '/exit1', '/exit1/:taskId' ];

               for( var i = 0; i < routes.length; ++i ) {
                  expect( $route.routes[routes[i]] ).toBeDefined();
               }
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'creates a redirect for the selected entry point', function() {
               // for everything apart from / we can rely on angular js to do the encoding
               expect( $route.routes[ '/entry' ].redirectTo ).toEqual( 'stepTwo/abc123/test%2Furl%2Fencoding' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sets the flow controller as controller for simple places', function() {
               expect( $route.routes[ '/stepOne' ].controller ).toEqual( 'portal.FlowController' );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'defines a controller', function() {

            var eventBus;
            var controller;
            var place;

            var $controller;
            var $rootScope;
            var $route;

            beforeEach( angularMocks.inject( function( _$controller_, _$rootScope_, _$route_ ) {
               $controller = _$controller_;
               $rootScope = _$rootScope_;
               $route = _$route_;

               $httpBackend.whenGET( testData.urls.flow ).respond( asFileResource( testData.flow ) );

               $injector.invoke( runBlock );
               $httpBackend.flush();

               EventBus.init( portalMocks.mockQ(), portalMocks.mockTick(), portalMocks.mockTick() );
               eventBus = EventBus.create();

               spyOn( eventBus, 'subscribe' ).andCallThrough();
               spyOn( eventBus, 'publish' ).andCallThrough();
               spyOn( eventBus, 'publishAndGatherReplies' ).andCallThrough();
               spyOn( eventBus, 'unsubscribe' ).andCallThrough();

               spyOn( log.context, 'setTag' );

               place = $route.routes[ '/stepTwo' ].resolve.place();
               controller = $controller( 'portal.FlowController', {
                  EventBus: eventBus,
                  place: place,
                  $routeParams: { taskId: 345 },
                  ThemeManager: {
                     getTheme: function() { return 'myTheme'; }
                  }
               } );
               jasmine.Clock.tick( 0 );
            } ) );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'that adds the current place to the root scope (jira ATP-6795)', function() {
               expect( $rootScope.place ).toEqual( place );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'that initially sends a willNavigate event with target _self', function() {
               expect( eventBus.publish ).toHaveBeenCalledWith( 'willNavigate._self', {
                  target: '_self'
               }, { sender: 'FlowController' } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'that requests loading of the current page', function() {
               expect( pageControllerMock_.setupPage ).toHaveBeenCalledWith( place.page );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'that eventually sends a didNavigate with the correct parameters', function() {
               expect( eventBus.publish ).toHaveBeenCalledWith( 'didNavigate._self', {
                  target: '_self',
                  place: 'stepTwo/:taskId/:anotherThing',
                  data: {
                     taskId: 345,
                     anotherThing: null
                  }
               }, { sender: 'FlowController' } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'that subscribes to navigateRequest events after navigation is complete', function() {
               expect( eventBus.publish ).toHaveBeenCalledWith( 'didNavigate._self', jasmine.any( Object ), jasmine.any( Object ) );
               expect( eventBus.subscribe )
                  .toHaveBeenCalledWith( 'navigateRequest', jasmine.any( Function ), { subscriber : 'FlowController' } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sets a log tag for the current place (#77)', function() {
               expect( log.context.setTag ).toHaveBeenCalledWith( 'PLCE', 'stepTwo/:taskId/:anotherThing' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'that sends the target place with the event (#13)', function() {
               var calls = eventBus.publish.calls
                  .filter( function( _ ) { return _.args[0].indexOf( 'didNavigate' ) === 0; } );
               expect( calls[0].args[1].place ).toEqual( 'stepTwo/:taskId/:anotherThing' );
            } );

            ///////////////////////////////////////////////////////////////////////////////////////////////

            it( 'unsubscribes from navigateRequest events on manual location change (#66)', function() {
               var navigateRequestSubscriber = eventBus.subscribe.calls.filter( function( call ) {
                  return call.args[0] === 'navigateRequest';
               } )[0].args[1];

               $controller( 'portal.FlowController', {
                  EventBus: eventBus,
                  place: $route.routes[ '/stepOne' ].resolve.place(),
                  // for everything apart from / we can rely on angular js to do the encoding
                  $routeParams: { taskId: '_' },
                  ThemeManager: {
                     getTheme: function() { return 'myTheme'; }
                  }
               } );
               jasmine.Clock.tick( 0 );

               expect( eventBus.unsubscribe ).toHaveBeenCalledWith( navigateRequestSubscriber );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'that on further navigation', function() {

               var $location;
               var $window;

               beforeEach( angularMocks.inject( function( _$location_, _$window_ ) {
                  $location = _$location_;
                  $window = _$window_;

                  spyOn( $location, 'path' ).andCallThrough();
                  jasmine.Clock.tick( 0 );
               } ) );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'changes the url using the parameters provided', function() {
                  eventBus.publish( 'navigateRequest.previous', {
                     target: 'previous',
                     data: {
                        taskId: 'halloTaskId'
                     }
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( $location.path ).toHaveBeenCalledWith( '/stepOne/halloTaskId' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'refreshes the page if configured (jira ATP-7932)', function() {
                  eventBus.publish( 'navigateRequest.next', {
                     target: 'next',
                     data: {
                        taskId: 'halloTaskId'
                     }
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( $window.location.href.split( '#' )[ 1 ] ).toEqual( '/stepThree/halloTaskId' );
                  expect( $window.location.reload ).toHaveBeenCalled();
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'changes the url using the previous place parameters for missing parameters (jira ATP-6165)', function() {
                  eventBus.publish( 'navigateRequest.previous', {
                     target: 'previous'
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( $location.path ).toHaveBeenCalledWith( '/stepOne/345' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'navigates to the current place again for the target _self (jira ATP-7080)', function() {
                  $location.path.reset();
                  eventBus.publish( 'navigateRequest._self', {
                     target: '_self',
                     data: {
                        taskId: 666,
                        anotherThing: 'this'
                     }
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( $location.path ).toHaveBeenCalledWith( '/stepTwo/666/this' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'unsubscribes from further navigateRequests events', function() {
                  var navigateRequestSubscriber = eventBus.subscribe.calls.filter( function( call ) {
                     return call.args[0] === 'navigateRequest';
                  } )[0].args[1];

                  eventBus.publish( 'navigateRequest.previous', {
                     target: 'previous'
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( eventBus.unsubscribe ).toHaveBeenCalledWith( navigateRequestSubscriber );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'encodes url parameters correctly (jira ATP-6775)', function() {
                  eventBus.publish( 'navigateRequest.previous', {
                     target: 'previous',
                     data: {
                        taskId: 'xx/%&+ßä xx'
                     }
                  } );
                  jasmine.Clock.tick( 0 );

                  // for everything apart from / we can rely on angular js to do the encoding
                  expect( $location.path ).toHaveBeenCalledWith( '/stepOne/xx%2F%&+ßä xx' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'decodes url parameters correctly (jira ATP-6775)', function() {
                  eventBus.publish.reset();
                  $controller( 'portal.FlowController', {
                     EventBus: eventBus,
                     place: $route.routes[ '/stepOne' ].resolve.place(),
                     // for everything apart from / we can rely on angular js to do the encoding
                     $routeParams: { taskId: 'xx%2F%&+ßä xx' },
                     ThemeManager: {
                        getTheme: function() { return 'myTheme'; }
                     }
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( eventBus.publish )
                     .toHaveBeenCalledWith( 'didNavigate.previous', {
                        target: 'previous',
                        place: 'stepOne/:taskId',
                        data: { taskId: 'xx/%&+ßä xx' }
                     }, { sender: 'FlowController' } );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'encodes null parameters as underscore (#65)', function() {
                  eventBus.publish( 'navigateRequest.previous', {
                     target: 'previous',
                     data: {
                        taskId: null
                     }
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( $location.path ).toHaveBeenCalledWith( '/stepOne/_' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'decodes underscores as null (#65)', function() {
                  eventBus.publish.reset();
                  $controller( 'portal.FlowController', {
                     EventBus: eventBus,
                     place: $route.routes[ '/stepOne' ].resolve.place(),
                     // for everything apart from / we can rely on angular js to do the encoding
                     $routeParams: { taskId: '_' },
                     ThemeManager: {
                        getTheme: function() { return 'myTheme'; }
                     }
                  } );
                  jasmine.Clock.tick( 0 );

                  expect( eventBus.publish )
                     .toHaveBeenCalledWith( 'didNavigate.previous', {
                        target: 'previous',
                        place: 'stepOne/:taskId',
                        data: { taskId: null }
                     }, { sender: 'FlowController' } );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'to the currently active place again', function() {

                  beforeEach( function() {
                     eventBus.publish( 'navigateRequest.entry', {
                        target: 'entry'
                     } );
                     jasmine.Clock.tick( 0 );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'afterwards accepts new navigation requests (#14)', function() {
                     $location.path.reset();
                     eventBus.publish( 'navigateRequest.previous', {
                        target: 'previous',
                        data: {
                           taskId: 'halloTaskId'
                        }
                     } );
                     jasmine.Clock.tick( 0 );

                     expect( $location.path ).toHaveBeenCalledWith( '/stepOne/halloTaskId' );
                  } );

               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'when not the place but only parameter values change', function() {

                  beforeEach( function() {
                     eventBus.publish( 'navigateRequest.previous', {
                        target: 'previous',
                        data: {
                           taskId: 'halloTaskId'
                        }
                     } );
                     jasmine.Clock.tick( 0 );

                     pageControllerMock_.tearDownPage.reset();

                     $controller( 'portal.FlowController', {
                        EventBus: eventBus,
                        place: $route.routes[ '/stepTwo' ].resolve.place(),
                        // for everything apart from / we can rely on angular js to do the encoding
                        $routeParams: {
                           taskId: 'bla',
                           anotherThing: 'blub'
                        },
                        ThemeManager: {
                           getTheme: function() { return 'myTheme'; }
                        }
                     } );

                     jasmine.Clock.tick( 0 );
                     $rootScope.$digest();
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'does not trigger loading of the page', function() {
                     expect( pageControllerMock_.tearDownPage ).not.toHaveBeenCalled();
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'propagates the new parameters', function() {
                     expect( eventBus.publish ).toHaveBeenCalledWith( 'didNavigate.previous', {
                        target: 'previous',
                        place: 'stepTwo/:taskId/:anotherThing',
                        data: {
                           taskId: 'bla',
                           anotherThing: 'blub'
                        }
                     }, { sender: 'FlowController' } );
                  } );

               } );

            } );

         } );

      } );

   } );

} );
