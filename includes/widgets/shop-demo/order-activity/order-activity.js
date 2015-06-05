/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   'angular',
   'pouchdb',
   'laxar',
   'laxar-patterns'
], function( ng, PouchDb, ax, patterns ) {
   'use strict';

   Controller.$inject = [ 'axContext' ];

   function Controller( axContext ) {

      var db = new PouchDb( axContext.features.database.pouchDb.dbId );
      axContext.resources = {};
      var features = axContext.features;

      patterns.resources.handlerFor( axContext ).registerResourceFromFeature( 'cart' );

      axContext.eventBus.subscribe( 'takeActionRequest.' + features.order.action, performOrder );

      function performOrder( event ) {
         if( !axContext.resources.cart ) {
            didTakeAction( event.action, 'SUCCESS' );
            ax.log.warn( 'Order request for empty cart' );
            return;
         }

         axContext.eventBus.publish( 'willTakeAction.' + event.action, event );
         db.post( { articles: axContext.resources.cart.entries } )
            .then( function() {
               didTakeAction( event.action, 'SUCCESS' );
               axContext.eventBus.publish( 'navigateRequest.' + features.order.target, {
                  target : features.order.target,
                  data: {}
               } );
            }, function() {
               didTakeAction( event.action, 'ERROR' );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function didTakeAction( action, outcome ) {
         axContext.eventBus.publish( 'didTakeAction.' + action + '.' + outcome, {
            action: action,
            outcome: outcome
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'orderActivity', [] ).controller( 'OrderActivityController', Controller );

} );
