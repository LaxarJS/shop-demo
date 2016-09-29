/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar',
   'angular',
   'require'
], function( ax, ng, require ) {
   'use strict';

   var BUFFER_SIZE = 2500;

   // To capture navigation and lifecycle events, the event log persists across LaxarJS navigation.
   var contentWindow;
   var cleanupInspector;
   var hasLogChannel;

   var developerHooks;
   var enabled;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', 'axEventBus' ];

   function Controller( $scope, eventBus ) {
      $scope.enabled = enabled;
      if( !$scope.enabled ) {
         return;
      }

      // Needed for inspection to work with laxar-mocks (run-block is run too early).
      ensureEventBusInspection( eventBus );

      $scope.commands = {
         open: openContentWindow
      };

      $scope.features.open.onActions.forEach( function( action ) {
         eventBus.subscribe( 'takeActionRequest.' + action, function( event ) {
            openContentWindow();
            eventBus.publish( 'didTakeAction.' + event.action, { action: event.action } );
         } );
      } );

      if( $scope.features.open.onGlobalMethod ) {
         window[ $scope.features.open.onGlobalMethod ] = openContentWindow;
      }

      developerHooks.gridSettings = ax.configuration.get( 'tooling.grid', undefined );
      if( developerHooks.gridSettings === undefined && Object.keys( $scope.features.grid ).length > 0 ) {
         developerHooks.gridSettings = $scope.features.grid;
      }

      $scope.$on( '$destroy', cleanup );


      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function cleanup() {
         if( $scope.features.open.onGlobalMethod ) {
            delete window[ $scope.features.open.onGlobalMethod ];
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function openContentWindow( mode ) {
         var contentUrl = require.toUrl( './content/' ) +
            ( mode || ( $scope.features.develop.enabled ? 'debug' : 'index' ) ) + '.html';

         var settings = {
            resizable: 'yes',
            scrollbars: 'yes',
            status: 'yes',
            width: 1280,
            height: 700
         };

         var settingsString = Object.keys( settings ).map( function( key ) {
            return key + '=' + settings[ key ];
         } ).join( ',' );

         if( !contentWindow || contentWindow.closed ) {
            contentWindow = window.open( contentUrl, 'axDeveloperTools', settingsString );
         }

         try {
            contentWindow.focus();
         }
         catch( e ) {
            ax.log.warn(
               'AxDeveloperToolsWidget: Popup was blocked. Unblock in browser, or use the "button" feature.'
            );
         }
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function startCapturingEvents( eventBus ) {
      enabled = ax.configuration.get( 'widgets.laxar-developer-tools-widget.enabled', true );
      if( !enabled ) {
         return;
      }

      ax._tooling.pages.addListener( onPageChange );

      developerHooks = window.axDeveloperTools = ( window.axDeveloperTools || {} );
      developerHooks.buffers = ( developerHooks.buffers || { events: [], log: [] } );
      developerHooks.eventCounter = developerHooks.eventCounter || Date.now();
      developerHooks.logCounter = developerHooks.logCounter || Date.now();
      developerHooks.pageInfo = developerHooks.pageInfo || ax._tooling.pages.current();
      developerHooks.pageInfoVersion = developerHooks.pageInfoVersion || 1;

      if( !hasLogChannel ) {
         ax.log.addLogChannel( logChannel );
         hasLogChannel = true;
      }

      ensureEventBusInspection( eventBus );

      window.addEventListener( 'beforeunload', function() {
         if( hasLogChannel ) {
            ax.log.removeLogChannel( logChannel );
            hasLogChannel = false;
         }
         if( cleanupInspector ) {
            cleanupInspector();
            cleanupInspector = null;
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function logChannel( messageObject ) {
         var index = developerHooks.logCounter++;
         var jsonItem = JSON.stringify( messageObject );
         pushIntoStore( 'log', { index: index, json: jsonItem } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function ensureEventBusInspection( globalEventBus ) {
      if( cleanupInspector ) {
         cleanupInspector();
      }

      cleanupInspector = globalEventBus.addInspector( function( item ) {
         var index = developerHooks.eventCounter++;
         var jsonItem = JSON.stringify( ax.object.options( { time: Date.now() }, item ) );

         pushIntoStore( 'events', {
            index: index,
            json: jsonItem
         } );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function onPageChange( pageInfo ) {
      if( ng.equals( developerHooks.pageInfo, pageInfo ) ) {
         return;
      }
      developerHooks.pageInfo = pageInfo;
      ++developerHooks.pageInfoVersion;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function pushIntoStore( storeName, item ) {
      var buffer = developerHooks.buffers[ storeName ];
      while( buffer.length >= BUFFER_SIZE ) {
         buffer.shift();
      }
      buffer.push( item );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'axDeveloperToolsWidget', [] )
       .run( [ 'axGlobalEventBus', startCapturingEvents ] )
       .controller( 'AxDeveloperToolsWidgetController', Controller );

} );
