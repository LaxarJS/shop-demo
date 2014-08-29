/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../widget_loader',
   '../../../testing/portal_mocks',
   '../../../file_resource_provider/file_resource_provider',
   '../../../event_bus/event_bus',
   '../../../logging/log',
   '../../modules/theme_manager',
   './data/widget_loader_data'
], function( widgetLoader, portalMocks, fileResourceProvider, EventBus, log, themeManager, testData ) {
   'use strict';

   describe( 'A widgetLoader', function() {

      it( 'throws if init is missing some required argument', function() {
         expect(function() {
            widgetLoader.init();
         } ).toThrow();
         expect(function() {
            widgetLoader.init( {} );
         } ).toThrow();
         expect(function() {
            widgetLoader.init( {}, {} );
         } ).toThrow();
         expect(function() {
            widgetLoader.init( {}, {}, {} );
         } ).not.toThrow();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An initialized widgetLoader', function() {

      var fileResourceProvider_;
      var q_;
      var themeManager_;
      var http_;

      beforeEach( function() {
         q_ = portalMocks.mockQ();
         http_ = portalMocks.mockHttp( q_ );

         fileResourceProvider.init( q_, http_ );
         fileResourceProvider_ = fileResourceProvider.create( '' );

         themeManager_ = themeManager.create( fileResourceProvider_, q_ );
         themeManager_.setTheme( 'default' );

         widgetLoader.init( themeManager_, fileResourceProvider_, q_, '/includes/widgets/' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'can create an event bus for a specific widget instance', function() {

         var widget;
         var eventBus;
         var widgetEventBus;

         beforeEach( function() {
            jasmine.Clock.useMock();

            EventBus.init( q_, portalMocks.mockTick(), portalMocks.mockTick() );
            eventBus = EventBus.create();
            spyOn( eventBus, 'subscribe' ).andCallThrough();
            spyOn( eventBus, 'publish' ).andCallThrough();
            spyOn( eventBus, 'publishAndGatherReplies' ); // not necessary to call through here

            widget = {
               id: 'myTestWidget',
               specification: {
                  name: 'TestWidget'
               }
            };
            widgetEventBus = widgetLoader.createEventBusForWidget( eventBus, widget );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where subscribe gets the widget as subscriber', function() {
            var handler = function() {};
            widgetEventBus.subscribe( 'event', handler );
            expect( eventBus.subscribe )
               .toHaveBeenCalledWith( 'event', handler, { subscriber: 'widget.TestWidget#myTestWidget' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where publish gets the widget as sender', function() {
            widgetEventBus.publish( 'event' );
            expect( eventBus.publish )
               .toHaveBeenCalledWith( 'event', undefined, { sender: 'widget.TestWidget#myTestWidget' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where additional properties on publish are merged with the sender', function() {
            widgetEventBus.publish( 'event', { item: 'value' } );
            expect( eventBus.publish )
               .toHaveBeenCalledWith( 'event', { item: 'value' }, { sender: 'widget.TestWidget#myTestWidget' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where options on publish are passed on to the event bus', function() {
            widgetEventBus.publish( 'event', {}, { deliverToSender: false } );
            expect( eventBus.publish )
               .toHaveBeenCalledWith( 'event', {}, {
                  sender: 'widget.TestWidget#myTestWidget',
                  deliverToSender: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where publishAndGatherReplies gets the widget as sender', function() {
            widgetEventBus.publishAndGatherReplies( 'event' );
            expect( eventBus.publishAndGatherReplies )
               .toHaveBeenCalledWith( 'event', undefined, { sender: 'widget.TestWidget#myTestWidget' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where options on publishAndGatherReplies are passed on to the event bus', function() {
            widgetEventBus.publishAndGatherReplies( 'event', {}, { deliverToSender: false } );
            expect( eventBus.publishAndGatherReplies )
               .toHaveBeenCalledWith( 'event', {}, {
                  sender: 'widget.TestWidget#myTestWidget',
                  deliverToSender: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a didUpdate event with data attribute is published', function() {

            beforeEach( function() {
               spyOn( log, 'develop' );

               widgetEventBus.publish( 'didUpdate.someResource', {
                  resource: 'someResource',
                  data: {
                     some: 'thing'
                  }
               } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'logs this incident in level develop (jira ATP-7350)', function() {
               expect( log.develop ).toHaveBeenCalledWith(
                  'Widget "[0]" published didUpdate-event using deprecated attribute "data" (event: [1]).\n' +
                     '   Change this to "patches" immediately.',
                  'widget.TestWidget#myTestWidget',
                  'didUpdate.someResource'
               );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'providing a didUpdate compatibility layer for widgets that are not json patch compatible', function() {

            var didUpdateSpy;

            beforeEach( function() {
               didUpdateSpy = jasmine.createSpy( 'didUpdateSpy' );
               widgetEventBus.subscribe( 'didUpdate.resource', didUpdateSpy );
               eventBus.publish( 'didUpdate.resource', {
                  resource: 'resource',
                  patches: [ { op: 'replace', path: '/x/y', value: 12 } ]
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'transforms json patches to updates', function() {
               var event = didUpdateSpy.calls[0].args[0];
               expect( event.updates ).toEqual( { 'x.y': 12 } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'unsubscribes correctly if requested', function() {
               didUpdateSpy.reset();
               widgetEventBus.unsubscribe( didUpdateSpy );

               eventBus.publish( 'didUpdate.resource', {
                  resource: 'resource',
                  patches: [ { op: 'replace', path: '/x/y', value: 12 } ]
               } );
               jasmine.Clock.tick( 0 );

               expect( didUpdateSpy.calls.length ).toBe( 0 );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'providing a didUpdate compatibility layer for widgets that are json patch compatible', function() {

            var didUpdateSpy;

            beforeEach( function() {
               widget = {
                  id: 'myTestWidget',
                  specification: {
                     name: 'TestWidget',
                     compatibility: [ 'json-patch' ]
                  }
               };
               widgetEventBus = widgetLoader.createEventBusForWidget( eventBus, widget );

               didUpdateSpy = jasmine.createSpy( 'didUpdateSpy' );
               widgetEventBus.subscribe( 'didUpdate.resource', didUpdateSpy );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'transforms updates to json patches', function() {
               eventBus.publish( 'didUpdate.resource', {
                  resource: 'resource',
                  updates: { 'x.y': 12 }
               } );
               jasmine.Clock.tick( 0 );

               var event = didUpdateSpy.calls[0].args[0];
               expect( event.patches ).toEqual( [ { op: 'replace', path: '/x/y', value: 12 } ] );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'transforms data to json patches root replace', function() {
               eventBus.publish( 'didUpdate.resource', {
                  resource: 'resource',
                  data: { 'x': { y: 12 } }
               } );
               jasmine.Clock.tick( 0 );

               var event = didUpdateSpy.calls[0].args[0];
               expect( event.patches ).toEqual( [ { op: 'replace', path: '', value: { x: { y: 12 } } } ] );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'transforms data and updates to json patches root replace and updates afterwards', function() {
               eventBus.publish( 'didUpdate.resource', {
                  resource: 'resource',
                  data: { 'x': { y: 12 } },
                  updates: { 'x.y': 15 }
               } );
               jasmine.Clock.tick( 0 );

               var event = didUpdateSpy.calls[0].args[0];
               expect( event.patches ).toEqual( [
                  { op: 'replace', path: '', value: { x: { y: 12 } } },
                  { op: 'replace', path: '/x/y', value: 15 }
               ] );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'can create infos for merging two lists of widgets', function() {

         var activeWidgets;
         var requestedWidgets;
         var mergeInfo;

         beforeEach( function() {
            activeWidgets = [
               {
                  'id': '1',
                  'pageIdHash': 'content.w1.1'
               },
               {
                  'id': '2',
                  'pageIdHash': 'content.w2.2'
               },
               {
                  'id': '3',
                  'pageIdHash': 'header.w2.3'
               }
            ];
            requestedWidgets = [
               {
                  'id': '1',
                  'pageIdHash': 'content.w1.1'
               },
               {
                  'id': '3',
                  'pageIdHash': 'content.w2.3'
               }
            ];

            mergeInfo = widgetLoader.widgetMergeInfo( activeWidgets, requestedWidgets );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that contains info about widgets to load', function() {
            expect( mergeInfo.load ).toEqual( [
               { requested: requestedWidgets[0], existing: requestedWidgets[0] },
               { requested: requestedWidgets[1], existing: null }
            ] );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that contains info about how many widgets to load from scratch', function() {
            expect( mergeInfo.numberOfWidgetsToLoad ).toEqual( 1 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that contains info about widgets to unload', function() {
            expect( mergeInfo.unload ).toEqual( [ activeWidgets[1], activeWidgets[2] ] );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'has a method to process widgets for a given page', function() {

         var page;
         var widgetsForPage;

         beforeEach( function() {
            page = {
               'areas': {
                  'content': [
                     {
                        widget: 'widget1',
                        id: '1'
                     },
                     {
                        widget: 'widget1',
                        id: '2'
                     }
                  ],

                  'header': [
                     {
                        widget: 'headerWidget',
                        id: '3'
                     }
                  ]
               }
            };

            widgetsForPage = widgetLoader.processWidgetsForPage( page );
            if( widgetsForPage[0].id === '3' ) {
               // here we just want to ensure a specific order of the array to keep the tests simple.
               // in practice that doesn't matter as long as the widgets of one area are in order.
               var widget = widgetsForPage[0];
               widgetsForPage.splice( 0, 1 );
               widgetsForPage.push( widget );
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that returns all widgets flattened to an array', function() {
            expect( widgetsForPage.length ).toEqual( 3 );
            expect( widgetsForPage[0].id ).toEqual( '1' );
            expect( widgetsForPage[1].id ).toEqual( '2' );
            expect( widgetsForPage[2].id ).toEqual( '3' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that adds the area as property to each widget', function() {
            expect( widgetsForPage[0].area ).toEqual( 'content' );
            expect( widgetsForPage[1].area ).toEqual( 'content' );
            expect( widgetsForPage[2].area ).toEqual( 'header' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that adds a page hash for later merging to each widget', function() {
            expect( widgetsForPage[0].pageIdHash ).toEqual( 'content.widget1.1' );
            expect( widgetsForPage[1].pageIdHash ).toEqual( 'content.widget1.2' );
            expect( widgetsForPage[2].pageIdHash ).toEqual( 'header.headerWidget.3' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'can determine the current set of features for a widget instance', function() {

         var widgetSpecification;
         var onlyRequiredConfiguration;
         var allConfiguration;

         beforeEach( function() {
            widgetSpecification = {
               features: {
                  button: {
                     type: 'object',
                     properties: {
                        label: {
                           type: 'string',
                           'default': 'hit me'
                        },
                        action: {
                           type: 'string',
                           format: 'topic',
                           required: true
                        }
                     }
                  },
                  headline: {
                     type: 'object',
                     properties: {
                        enabled: {
                           type: 'boolean',
                           'default': false
                        }
                     }
                  }
               }
            };

            onlyRequiredConfiguration = {
               features: {
                  button: {
                     action: 'punch'
                  }
               }
            };

            allConfiguration = {
               features: {
                  button: {
                     label: 'push the button',
                     action: 'panic'
                  },
                  headline: {
                     enabled: true
                  }
               }
            };
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where no specified features lead to no configured features', function() {
            expect( widgetLoader.featuresForWidget( {}, {} ) ).toEqual( {} );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where specifing only required features, defaults are used', function() {
            expect( widgetLoader.featuresForWidget( widgetSpecification, onlyRequiredConfiguration ) )
               .toEqual( {
                  button: {
                     label: 'hit me',
                     action: 'punch'
                  },
                  headline: {
                     enabled: false
                  }
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where specifing all features the defaults are overwritten', function() {
            expect( widgetLoader.featuresForWidget( widgetSpecification, allConfiguration ) )
               .toEqual( allConfiguration.features );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where missing required features lead to an error', function() {
            var badConf = {
               id: 'theBadGuy',
               features: {}
            };

            expect( function() {
               widgetLoader.featuresForWidget( widgetSpecification, badConf );
            } ).toThrow( 'Validation for widget features failed (Widget-ID theBadGuy). Errors: ' +
               '\n - Missing required property: action. Path: "$.button.action".' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where using a wrong type for a property leads to an error', function() {
            onlyRequiredConfiguration.features.button.label = true;
            onlyRequiredConfiguration.id = 'theBadGuy';

            expect( function() {
               widgetLoader.featuresForWidget( widgetSpecification, onlyRequiredConfiguration );
            } ).toThrow( 'Validation for widget features failed (Widget-ID theBadGuy). Errors: ' +
               '\n - Invalid type: boolean should be one of string,null. Path: "$.button.label".' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where using an invalid topic format leads to an error', function() {
            onlyRequiredConfiguration.features.button.action = 'underscore_is_forbidden';
            onlyRequiredConfiguration.id = 'theBadGuy';

            expect( function() {
               widgetLoader.featuresForWidget( widgetSpecification, onlyRequiredConfiguration );
            } ).toThrow( 'Validation for widget features failed (Widget-ID theBadGuy). Errors: ' +
               '\n - Validation error: format. Path: "$.button.action".' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'when features are specified as complete draft v4 JSON schema (#34)', function() {
            var v4Spec = {
               features: {
                  $schema: 'http://json-schema.org/draft-04/schema#',
                  type: 'object',
                  properties: {
                     featureOne: {
                        type: 'object',
                        required: [ 'x' ],
                        properties: {
                           x: {
                              type: 'string'
                           }
                        }
                     }
                  }
               }
            };
            var config = {
               features: {
                  featureOne: {
                     x: 'abc'
                  }
               }
            };

            expect( widgetLoader.featuresForWidget( v4Spec, clone( config ) ) )
               .toEqual( config.features );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with custom JSON schema formats for widget configuration', function() {

         var widgetSpec;
         var configuration;

         beforeEach( function() {
            widgetSpec = {
               features: {
                  testFeature: {
                     type: 'object',
                     properties: {
                        i18nLabel: {
                           type: [ 'string', 'object' ],
                           format: 'localization'
                        },
                        someLanguageTag: {
                           type: 'string',
                           format: 'language-tag'
                        },
                        resourceByAction: {
                           type: 'object',
                           format: 'topic-map',
                           additionalProperties: {
                              type: 'string',
                              format: 'topic'
                           }
                        },
                        someSubTopic: {
                           type: 'string',
                           format: 'sub-topic'
                        },
                        onSomeFlags: {
                           type: 'array',
                           items: {
                              type: 'string',
                              format: 'flag-topic'
                           }
                        }
                     }
                  }
               }
            };

            configuration = {
               features: {
                  testFeature: {
                     i18nLabel: {
                        'de': 'test',
                        'en_US': 'more test'
                     },
                     someLanguageTag: 'de_AT-x-laxar',
                     resourceByAction: {
                        'myAction': 'myResource',
                        'myAction-ok': 'myResource+stuff'
                     },
                     someSubTopic: 'a+sub+topic',
                     onSomeFlags: [ 'positive', '!oh-so-negated' ]
                  }
               }
            };
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'checks the "localization" format', function() {
            var config = clone( configuration );
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();

            config = clone( configuration );
            config.features.testFeature.i18nLabel[ 'bad tag' ] = 'bad tag';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();

            config = clone( configuration );
            config.features.testFeature.i18nLabel[ 'en-x-toosoon-US' ] = 'bad tag';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();

            config = clone( configuration );
            config.features.testFeature.i18nLabel[ 'en-US-x-trailing' ] = 'ok';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'checks the "language-tag" format', function() {
            var config = clone( configuration );
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();

            config = clone( configuration );
            config.features.testFeature.someLanguageTag = 'bad tag';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();

            config = clone( configuration );
            config.features.testFeature.someLanguageTag = 'en-x-toosoon-US';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();

            config = clone( configuration );
            config.features.testFeature.someLanguageTag = 'en-US-x-trailing';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'checks the "topic-map" format', function() {
            var config = clone( configuration );
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();

            config = clone( configuration );
            config.features.testFeature.resourceByAction[ 'bad action' ] = 'something';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'checks the "topic" format', function() {
            var config = clone( configuration );
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();

            config = clone( configuration );
            config.features.testFeature.resourceByAction[ 'myAction' ] = 'my_bad';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'checks the "sub-topic" format', function() {
            var config = clone( configuration );
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();

            config = clone( configuration );
            config.features.testFeature.someSubTopic = 'not-a-sub';
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'checks the "flag-topic" format', function() {
            var config = clone( configuration );
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).not.toThrow();

            config = clone( configuration );
            config.features.testFeature.onSomeFlags = [ 'not a flag topic' ];
            expect( function() { widgetLoader.featuresForWidget( widgetSpec, config ); } ).toThrow();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'has a method to resolve widgets', function() {

         beforeEach( function() {
            jasmine.Clock.useMock();

            spyOn( fileResourceProvider_, 'provide' ).andCallFake( function( widgetJson ) {
               if( /\/widgets\/portal\/test_widget\/widget.json$/.test( widgetJson ) ) {
                  return q_.when( clone( testData.widgets.testWidget ) );
               }

               var widget = clone( testData.widgets.testWidget );
               widget.integration.type = 'magic';
               return q_.when( widget );
            } );

            spyOn( fileResourceProvider_, 'isAvailable' ).andReturn( q_.when( false ) );

            widgetLoader.addWidgetResolver( 'angular', {
               resolve: function( /*widget*/ ) {
                  return clone( testData.resolvedWidgets['portal/test_widget'] );
               }
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where an existing widget is resolved', function() {
            var resolved = null;
            widgetLoader.resolveWidget( 'portal/test_widget', 'default' )
               .then( function( r ) {
                  resolved = r;
               } );
            jasmine.Clock.tick( 0 );

            expect( resolved ).toEqual( testData.resolvedWidgets['portal/test_widget'] );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where by default a cache is used', function() {
            expect( fileResourceProvider_.provide.calls.length ).toEqual( 0 );

            widgetLoader.resolveWidget( 'portal/test_widget', 'default' );
            jasmine.Clock.tick( 0 );
            expect( fileResourceProvider_.provide.calls.length ).toEqual( 1 );

            widgetLoader.resolveWidget( 'portal/test_widget', 'default' );
            jasmine.Clock.tick( 0 );
            expect( fileResourceProvider_.provide.calls.length ).toEqual( 1 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where no cache is used if requested', function() {
            expect( fileResourceProvider_.provide.calls.length ).toEqual( 0 );

            widgetLoader.resolveWidget( 'portal/test_widget', 'default' );
            jasmine.Clock.tick( 0 );
            expect( fileResourceProvider_.provide.calls.length ).toEqual( 1 );

            widgetLoader.resolveWidget( 'portal/test_widget', 'default', { ignoreCache: true } );
            jasmine.Clock.tick( 0 );
            expect( fileResourceProvider_.provide.calls.length ).toEqual( 2 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'where an unknown integration type leads to an error', function() {
            var error = null;

            widgetLoader.resolveWidget( 'portal/test_widget_wrong', 'default' )
               .then( null, function( e ) {
                  error = e;
               } );
            jasmine.Clock.tick( 0 );

            expect( error.message ).toEqual( 'unknown integration type magic' );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function clone( obj ) {
      return JSON.parse( JSON.stringify( obj ) );
   }

} );
