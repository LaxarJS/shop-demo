/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/* global chrome */

define( [
   'laxar',
   'angular'
], function( ax, ng ) {
   'use strict';

   var REFRESH_DELAY_MS = 100;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];
   //Security wrapper denied access to property "buffers" on privileged Javascript object.
   //Support for exposing privileged objects to untrusted content via __exposedProps__ is being
   //gradually removed - use WebIDL bindings or Components.utils.cloneInto instead.
   // Note that only the first denied property access from a given global object will be reported.
   function Controller( $scope ) {
      var eventBus = $scope.eventBus;
      var pageInfoVersion = -1;
      var timeout;
      var lastIndexByStream = {};
      var isLaxarApplication;
      var isBrowserWebExtension = ( window.chrome && chrome.runtime && chrome.runtime.id );
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

      if( window.opener ) {
         eventBus.subscribe( 'beginLifecycleRequest', function() {
            publishLaxarApplicationFlag( true );
            tryPublishData();
         } );
      }
      else {
         eventBus.subscribe( 'beginLifecycleRequest', function() {
            publishLaxarApplicationFlag( false );
            window.addEventListener( 'message', extensionEventListener );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function extensionEventListener( event ) {
         var channel = JSON.parse( event.detail || event.data );
         if( channel.text === 'noLaxarDeveloperToolsApi' ) {
            publishLaxarApplicationFlag( false );
            return;
         }
         var channelGridSettings = channel && channel.gridSettings;
         if( $scope.features.grid.resource ) {
            publishGridSettings( channelGridSettings );
         }
         if( channel && channel.pageInfoVersion > pageInfoVersion ) {
            publishAndSetPageInfoVersion( channel.pageInfo, channel.pageInfoVersion );
         }
         var buffers = channel && channel.buffers;
         if( buffers ) {
            publishStream( 'events', buffers );
            publishStream( 'log', buffers );
            publishLaxarApplicationFlag( true );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function tryPublishData() {
         try {
            var channel = window.opener.axDeveloperTools;
            publishDataOrHandleException( channel, false );
         }
         catch( exception ) {
            publishDataOrHandleException( undefined, true );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishDataOrHandleException( channel, isException ) {
         if( isException ) {
            publishLaxarApplicationFlag( false );
         }
         else {
            var channelGridSettings = channel && channel.gridSettings;
            if( $scope.features.grid.resource ) {
               publishGridSettings( channelGridSettings );
            }
            publishLaxarApplicationFlag( true );
            checkForData();
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishGridSettings( channelGridSettings ) {
         if( !channelGridSettings ) {
            channelGridSettings = null;
         }
         eventBus.publish( 'didReplace.' + $scope.features.grid.resource, {
            resource: $scope.features.grid.resource,
            data: channelGridSettings
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function checkForData() {
         try {
            var channel = window.opener.axDeveloperTools;
            checkForDataOrHandleException( channel, false );
         } catch (e) {
            checkForDataOrHandleException( undefined, true );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function checkForDataOrHandleException( channel, isException ) {
         if( isException ) {
            publishLaxarApplicationFlag( false );
         }
         else {
            var buffers = channel && channel.buffers;
            if( buffers ) {
               publishStream( 'events', buffers );
               publishStream( 'log', buffers );
            }
            if( channel && channel.pageInfoVersion > pageInfoVersion ) {
               publishAndSetPageInfoVersion( channel.pageInfo, channel.pageInfoVersion );
            }
            publishLaxarApplicationFlag( true );
            timeout = window.setTimeout( checkForData, REFRESH_DELAY_MS );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishAndSetPageInfoVersion( pageInfo, version ) {
         pageInfoVersion = version;
         eventBus.publish( 'didReplace.' + $scope.features.pageInfo.resource, {
            resource: $scope.features.pageInfo.resource,
            data: pageInfo
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishStream( bufferFeature, buffers ) {
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
         navigation( events );
      }

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      function navigation( events ) {
         events.forEach( function( event ) {
            if( event.action === 'publish' && event.event.substr( 0, 11 ) === 'didNavigate') {
               eventBus.publish( 'takeActionRequest.navigation', {
                  action: 'navigation'
               } );
            }
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishLaxarApplicationFlag( state ) {
         if( isLaxarApplication !== state ) {
            eventBus.publish( 'didChangeFlag.' + $scope.features.laxarApplication.flag + '.' + state, {
               flag: $scope.features.laxarApplication.flag,
               state: state
            } );
            isLaxarApplication = state;
            if( isBrowserWebExtension ) {
               chrome.runtime.sendMessage( {
                  active: state,
                  id: chrome.devtools.inspectedWindow.tabId
               } );
            }
         }
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'hostConnectorWidget', [] )
      .controller( 'HostConnectorWidgetController', Controller );

} );
