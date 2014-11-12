/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'angular-route',
   '../../logging/log',
   '../../json/validator',
   '../../utilities/object',
   '../../utilities/timer',
   '../paths',
   'json!../../../static/schemas/flow.json'
], function( ng, ngRoute, log, jsonValidator, object, timer, paths, flowSchema ) {
   'use strict';

   var module = ng.module( 'laxar.portal.flow', [ 'ngRoute' ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var $routeProvider_;

   module.config( [ '$routeProvider', function( $routeProvider ) {
      $routeProvider_ = $routeProvider;
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var $http_;
   var $q_;
   var fileResourceProvider_;
   var exitPoints_;
   var entryPoint_;

   module.run( [
      '$route', '$http', '$q', 'Configuration', 'FileResourceProvider',

      function( $route, $http, $q, configuration, fileResourceProvider ) {
         $http_ = $http;
         fileResourceProvider_ = fileResourceProvider;
         $q_ = $q;

         entryPoint_ = configuration.get( 'portal.flow.entryPoint' );
         exitPoints_ = configuration.get( 'portal.flow.exitPoints' );

         // idea for lazy loading routes using $routeProvider and $route.reload() found here:
         // https://groups.google.com/d/msg/angular/mrcy_2BZavQ/Mqte8AvEh0QJ
         loadFlow( paths.FLOW_JSON ).then( function() {
            $route.reload();
         } );
      } ]
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var SESSION_KEY_TIMER = 'navigationTimer';
   var TARGET_SELF = '_self';
   var places_;
   var previousPlaceParameters_;
   var previousNavigateRequestSubscription_;
   var currentTarget_ = TARGET_SELF;
   var navigationInProgress_ = false;
   var navigationTimer_;

   var eventOptions = { sender: 'FlowController' };
   var subscriberOptions = { subscriber: 'FlowController' };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.controller( 'portal.FlowController', [
      '$window', '$location', '$routeParams', '$rootScope', 'place', 'EventBus', 'axPageService',

      function FlowController( $window, $location, $routeParams, $rootScope, place, eventBus, pageService ) {
         if( previousNavigateRequestSubscription_ ) {
            eventBus.unsubscribe( previousNavigateRequestSubscription_ );
            previousNavigateRequestSubscription_ = null;
         }

         // The flow controller is instantiated on route change by AngularJS. It then announces the start of
         // navigation ("willNavigate") and initiates loading of the new page. As soon as the new page is
         // loaded, the "didNavigate" event finishes the navigation logic. The flow controller then starts to
         // listen for subsequent navigateRequests.

         var previousPlace = $rootScope.place;
         var page = place.page;
         $rootScope.place = place;

         if( typeof place.exitFunction === 'string' ) {
            var exit = place.exitFunction;
            if( exitPoints_ && typeof exitPoints_[ exit ] === 'function' ) {
               var placeParameters = constructNavigationParameters( $routeParams, place );
               exitPoints_[ exit ]( placeParameters );
               return;
            }
            throw new Error( 'Exitpoint "' + exit + '" does not exist.' );
         }

         navigationInProgress_ = true;
         var navigateEvent = { target: currentTarget_ };
         var didNavigateEvent =  object.options( { data: {}, place: place.id }, navigateEvent );

         eventBus.publish( 'willNavigate.' + currentTarget_, navigateEvent, eventOptions )
            .then( function() {
               var parameters = constructNavigationParameters( $routeParams, place );
               didNavigateEvent.data = parameters;
               previousPlaceParameters_ = parameters;

               if( place === previousPlace ) {
                  return finishNavigation( currentTarget_, didNavigateEvent );
               }

               return pageService.controller().tearDownPage()
                  .then( function() {
                     navigationTimer_ = timer.resumedOrStarted( {
                        label: [ 'loadTimer (', place.target ? place.target._self : place.id, ')'].join( '' ),
                        persistenceKey: SESSION_KEY_TIMER
                     } );
                     return pageService.controller().setupPage( page );
                  } )
                  .then( function() {
                     return finishNavigation( currentTarget_, didNavigateEvent );
                  } )
                  .then( function() {
                     navigationTimer_.stopAndLog( 'didNavigate' );
                  } );
            } )
            .then( null, function( error ) {
               log.error( error );
            } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function handleNavigateRequest( event, meta ) {
            if( navigationInProgress_ ) {
               // make sure that at most one navigate request be handled at the same time
               return;
            }
            navigationInProgress_ = true;

            currentTarget_ = event.target;
            var placeName = findPlaceForNavigationTarget( event.target, place );
            var parameters = object.extend( {}, previousPlaceParameters_ || {}, event.data || {} );
            var newPlace = places_[ placeName ];

            navigationTimer_ = timer.started( {
               label: [
                  'navigation (', place ? place.targets._self : '', ' -> ', newPlace.targets._self, ')'
               ].join( '' ),
               persistenceKey: SESSION_KEY_TIMER
            } );
            if( newPlace.triggerBrowserReload || event.triggerBrowserReload ) {
               triggerReload( placeName, parameters );
               return;
            }

            var newPath = constructLocation( placeName, parameters );
            if( newPath !== $location.path() ) {
               // this will instantiate another flow controller
               $location.path( newPath );

               meta.unsubscribe();
            }
            else {
               // nothing to do:
               navigationInProgress_ = false;
            }
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function triggerReload( placeName, parameters ) {
            eventBus.publish( 'willNavigate.' + currentTarget_, navigateEvent, eventOptions )
               .then( function() {
                  return pageService.controller().tearDownPage();
               } )
               .then( function() {
                  var path = constructLocation( placeName, parameters );
                  var url = '' + $window.location.href;
                  var newUrl = url.split( '#' )[ 0 ] + '#' + path;
                  // Prevent angular from entering a loop of location changes during digest
                  // by pretending that we have already navigated. This is actually true, because
                  // we do navigate ourselves using location.reload.
                  $location.absUrl = function() {
                     return $window.location.href;
                  };

                  $window.location.href = newUrl;
                  $window.location.reload();
               } );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function finishNavigation( currentTarget_, didNavigateEvent ) {
            eventBus.subscribe( 'navigateRequest', handleNavigateRequest, subscriberOptions );
            log.context.setTag( 'PLCE', place.id );
            previousNavigateRequestSubscription_ = handleNavigateRequest;
            navigationInProgress_ = false;
            return eventBus.publish( 'didNavigate.' + currentTarget_, didNavigateEvent, eventOptions );
         }

      }
   ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function constructNavigationParameters( $routeParams, place ) {
      var placeParameters = {};
      var params = place.fixedParameters || $routeParams;
      object.forEach( place.expectedParameters, function( parameterName ) {
         placeParameters[ parameterName ] = decodePlaceParameter( params[ parameterName ] );
      } );

      return placeParameters;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function constructLocation( placeName, parameters ) {
      var place = places_[ placeName ];
      var location = '/' + placeName;

      object.forEach( place.expectedParameters, function( parameterName ) {
         location += '/' + encodePlaceParameter( parameters[ parameterName ] );
      } );

      return location;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function findPlaceForNavigationTarget( targetOrPlaceName, activePlace ) {
      var placeName = object.path( activePlace, 'targets.' + targetOrPlaceName, targetOrPlaceName );
      if( placeName in places_ ) {
         return placeName;
      }

      log.error( 'Unknown target or place "[0]".', targetOrPlaceName );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function loadFlow( flowFile ) {
      return fetchPlaces( flowFile )
         .then( function( places ) {
            places_ = processPlaceParameters( places );

            object.forEach( places_, function( place, routeName ) {
               assembleRoute( routeName, place );
            } );

            $routeProvider_.otherwise( {
               redirectTo: '/entry'
            } );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function assembleRoute( routeName, place ) {
      if( place.redirectTo ) {
         $routeProvider_.when( '/' + routeName, {
            redirectTo: place.redirectTo
         } );
         return;
      }

      if( place.entryPoints ) {
         $routeProvider_.when( '/' + routeName, {
            redirectTo: routeByEntryPoint( place.entryPoints )
         } );
         return;
      }

      $routeProvider_.when( '/' + routeName, {
         template: '<!---->',
         controller: 'portal.FlowController',
         resolve: {
            place: function() {
               return place;
            }
         }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function routeByEntryPoint( possibleEntryPoints ) {
      var entryPoint = entryPoint_ || { target: 'default', parameters: {} };

      var placeName = possibleEntryPoints[ entryPoint.target ];
      if( placeName ) {
         var targetPlace = places_[ placeName ];
         var uri = placeName;
         var parameters = entryPoint.parameters || {};

         object.forEach( targetPlace.expectedParameters, function( parameterName ) {
            uri += '/' + encodePlaceParameter( parameters[ parameterName ] );
         } );

         return uri;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var ROUTE_PARAMS_MATCHER = /\/:([^\/]+)/ig;

   function processPlaceParameters( places ) {
      var processedRoutes = {};

      object.forEach( places, function( place, placeName ) {
         place.expectedParameters = [];
         place.id = placeName;

         if( !place.targets ) {
            place.targets = {};
         }
         if( !place.targets[ TARGET_SELF ] ) {
            place.targets[ TARGET_SELF ] = placeName.split( /\/:/ )[0];
         }

         var matches;
         while( ( matches = ROUTE_PARAMS_MATCHER.exec( placeName ) ) ) {
            var routeNameWithoutParams = placeName.substr( 0, matches.index );

            place.expectedParameters.push( matches[ 1 ] );

            processedRoutes[ routeNameWithoutParams ] = place;
         }
         processedRoutes[ placeName ] = place;
      } );

      return processedRoutes;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function fetchPlaces( flowFile ) {
      // NEEDS FIX C: Switch to using file resource provider here as well
      return $http_.get( flowFile )
         .then( function( response ) {
            var flow = response.data;

            validateFlowJson( flow );

            return flow.places;
         }, function( err ) {
            throw new Error( 'Failed to load "' + flowFile + '". Cause: ' + err );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function validateFlowJson( flowJson ) {
      var result = jsonValidator.create( flowSchema ).validate( flowJson );

      if( result.errors.length ) {
         result.errors.forEach( function( error ) {
            log.error( '[0]', error.message );
         } );

         throw new Error( 'Illegal flow.json format' );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function encodePlaceParameter( value ) {
      if( value == null ) {
         return '_';
      }
      return typeof value === 'string' ? value.replace( /\//g, '%2F' ) : value;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function decodePlaceParameter( value ) {
      if( value == null || value === '' || value === '_' ) {
         return null;
      }
      return typeof value === 'string' ? value.replace( /%2F/g, '/' ) : value;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
