/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 */
define( [
   'laxar',
   'angular'
], function( ax, ng ) {
   'use strict';

   var REFRESH_DELAY_MS = 100;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {
      var eventBus = $scope.eventBus;
      var pageInfoVersion = -1;
      var timeout;
      var lastIndexByStream = {};

      // If the development server is used and we don't want the development window to be reloaded each
      // time something changes during development, we shutdown live reload here.
      if( window.LiveReload && !$scope.features.development.liveReload ) {
         window.LiveReload.shutDown();
      }

      $scope.$on( '$destroy', function() {
         if( timeout ) {
            window.clearTimeout( timeout );
         }
      } );

      eventBus.subscribe( 'beginLifecycleRequest', function() {
         if( !window.opener ) {
            window.alert( 'laxar-developer-tools-widget: window must be opened from a LaxarJS page.' );
            return;
         }

         var hostApplicationAvailable = tryPublishGridSettings();
         if( hostApplicationAvailable ) {
            checkForData();
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function tryPublishGridSettings() {
         var channel;
         try {
            channel = window.opener.axDeveloperTools;
         }
         catch( exception ) {
            handleApplicationGone();
            return false;
         }

         var channelGridSettings = channel && channel.gridSettings;
         if( $scope.features.grid.resource && channelGridSettings ) {
            eventBus.publish( 'didReplace.' + $scope.features.grid.resource, {
               resource: $scope.features.grid.resource,
               data: channelGridSettings
            } );
         }
         return true;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function checkForData() {
         var channel;
         try {
            channel = window.opener.axDeveloperTools;
         } catch (e) {
            handleApplicationGone();
            return;
         }
         var buffers = channel && channel.buffers;
         if( buffers ) {
            publishStream( 'events' );
            publishStream( 'log' );
         }
         if( channel && channel.pageInfoVersion > pageInfoVersion ) {
            pageInfoVersion = channel.pageInfoVersion;
            eventBus.publish( 'didReplace.' + $scope.features.pageInfo.resource, {
               resource: $scope.features.pageInfo.resource,
               data: channel.pageInfo
            } );
         }

         timeout = window.setTimeout( checkForData, REFRESH_DELAY_MS );
         function publishStream( bufferFeature ) {
            var buffer = buffers[ bufferFeature ];
            var lastIndex = lastIndexByStream[ bufferFeature ] || -1;
            var events = buffer
               .filter( function( _ ) { return lastIndex < _.index; } )
               .map( function ( _ ) { return JSON.parse( _.json ); } );
            if( !events.length ) {
               return;
            }
            eventBus.publish( 'didProduce.' + $scope.features[ bufferFeature ].stream, {
               stream: $scope.features[ bufferFeature ].stream,
               data: events
            } );
            lastIndexByStream[ bufferFeature ] = buffer[ buffer.length - 1 ].index;
         }

      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleApplicationGone() {
         var message =
            'laxar-developer-tools-widget: Cannot access LaxarJS host window (or tab). Is it still open?';
         ax.log.error( message );
         eventBus.publish( 'didEncounterError', message );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'hostConnectorWidget', [] )
      .controller( 'HostConnectorWidgetController', Controller );

} );
