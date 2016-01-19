/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'moment'
], function( angular, ax, moment ) {
   'use strict';

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      $scope.model = {
         messages: []
      };

      $scope.commands = {
         discard: function() {
            $scope.model.messages.length = 0;
         }
      };

      if( $scope.features.log.stream ) {
         $scope.eventBus.subscribe(  'didProduce.' + $scope.features.log.stream, function( event ) {
            if( Array.isArray( event.data ) ) {
               event.data.forEach( displayLogMessage );
            }
            else {
               displayLogMessage( event.data );
            }
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function displayLogMessage( message ) {
         $scope.model.messages.unshift( {
            text: ax.string.format( message.text, message.replacements ),
            level: message.level,
            time: message.time,
            location: message.sourceInfo.file + ':' + message.sourceInfo.line
         } );

         while( $scope.model.messages.length > $scope.features.log.bufferSize ) {
            $scope.model.messages.pop();
         }
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return angular.module( 'logDisplayWidget', [] )
      .controller( 'LogDisplayWidgetController', Controller )
      .filter( 'logDisplayFormattedDate', function() {
         return function( date ) {
            return moment( date ).format( 'YYYY-MM-DD HH:mm:ss.SSS' );
         };
      } );

} );
