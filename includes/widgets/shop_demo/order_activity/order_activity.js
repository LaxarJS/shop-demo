/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   'angular',
   'pouchdb',
   'laxar',
   'laxar_patterns'
], function( ng, PouchDb, ax, patterns ) {
   'use strict';

   var moduleName = 'widgets.shop_demo.order_activity';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      var db = new PouchDb( $scope.features.database.pouchDb.dbId );
      $scope.resources = {};
      var features = $scope.features;

      patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'cart' );

      $scope.eventBus.subscribe( 'takeActionRequest.' + features.order.action, performOrder );

      function performOrder( event ) {
         if( !$scope.resources.cart ) {
            didTakeAction( event.action, 'SUCCESS' );
            ax.log.warn( 'Order request for empty cart' );
            return;
         }

         $scope.eventBus.publish( 'willTakeAction.' + event.action, event );
         db.post( { articles: $scope.resources.cart.entries } )
            .then( function() {
               didTakeAction( event.action, 'SUCCESS' );
               $scope.eventBus.publish( 'navigateRequest.' + features.order.target, {
                  target : features.order.target,
                  data: {}
               } );
            }, function() {
               didTakeAction( event.action, 'ERROR' );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function didTakeAction( action, outcome ) {
         $scope.eventBus.publish( 'didTakeAction.' + action + '.' + outcome, {
            action: action,
            outcome: outcome
         } );
      }

   }

   module.controller( moduleName + '.Controller', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
