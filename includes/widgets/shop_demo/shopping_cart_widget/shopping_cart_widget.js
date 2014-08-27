/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   'angular',
   'laxar',
   'laxar_patterns',
   'angular-sanitize'
], function( ng, ax, patterns ) {
   'use strict';

   var moduleName = 'widgets.shop_demo.shopping_cart_widget';
   var module     = ng.module( moduleName, [ 'ngSanitize' ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      var features = $scope.features;
      $scope.resources = {
         cart: {
            entries: [],
            sum: 0
         }
      };
      var resources = $scope.resources;
      $scope.model = {
         hint: features.display.htmlNoItemsText
      };
      var model = $scope.model;
      var updatePublisherForCart = patterns.resources.updatePublisherForFeature( $scope, 'cart' );
      var updateHandlerForCart = patterns.resources.updateHandler( $scope, 'cart' );

      $scope.eventBus.subscribe( 'didUpdate.cart', updateHandlerForCart );

      patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'article' );

      $scope.features.article.onActions.forEach( function( action ) {
         $scope.eventBus.subscribe( 'takeActionRequest.' + action, addArticleToCart );
      } );

      $scope.eventBus.subscribe( 'didTakeAction.' + $scope.features.cart.order.action + '.SUCCESS', function() {
         resources.cart = { entries: [] };
         replaceCart();
         model.hint = features.display.htmlOrderedCartText;
      } );

      $scope.eventBus.subscribe( 'didTakeAction.' + $scope.features.cart.order.action + '.ERROR', function() {
         model.hint = features.display.htmlOrderedCartErrorText;
      } );

      $scope.eventBus.subscribe( 'beginLifecycleRequest', replaceCart );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.increaseQuantity = function( index ) {
         var oldCart = ax.object.deepClone( resources.cart );
         resources.cart.entries[ index ].quantity++;
         updateSum();
         updatePublisherForCart.compareAndPublish( oldCart, resources.cart );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.decreaseQuantity = function( index ) {
         var oldCart = ax.object.deepClone( resources.cart );
         if( resources.cart.entries[ index ].quantity === 1 ) {
            resources.cart.entries.splice( index, 1 );
            updateSum();
            if( resources.cart.entries.length === 0 ) {
               model.hint = features.display.htmlNoItemsText;
               replaceCart();
            }
            else {
               updatePublisherForCart.compareAndPublish( oldCart, resources.cart );
            }
         } else {
            resources.cart.entries[ index ].quantity--;
            updateSum();
            updatePublisherForCart.compareAndPublish( oldCart, resources.cart );
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.performOrder = function() {
         var actionName = $scope.features.cart.order.action;
         $scope.eventBus.publish( 'takeActionRequest.' + actionName, {
            action: actionName
         } );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function addArticleToCart( event ) {
         $scope.eventBus.publish( 'willTakeAction.' + event.action, event );

         if( resources.article != null ) {
            var index = indexOfArticleInCart( resources.article );
            if( index === -1 ) {
               var oldCart = ax.object.deepClone( resources.cart );
               resources.cart.entries.push( {
                  article: resources.article,
                  quantity: 1
               } );
               model.hint = '';
               updateSum();
               updatePublisherForCart.compareAndPublish( oldCart, resources.cart );
            }
            else {
               $scope.increaseQuantity( index );
            }
         }

         $scope.eventBus.publish( 'didTakeAction.' + event.action, event );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function indexOfArticleInCart( article ) {
         for( var i = 0; i < resources.cart.entries.length; ++i ) {
            if( resources.cart.entries[ i ].article.id === article.id ) {
               return i;
            }
         }
         return -1;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function replaceCart() {
         $scope.eventBus.publish( 'didReplace.' + features.cart.resource, {
               resource: features.cart.resource,
               data: resources.cart
            }, {
               deliverToSender: false
            }
         );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function updateSum() {
         resources.cart.sum = 0;
         resources.cart.entries.forEach( function( article ) {
            resources.cart.sum = resources.cart.sum +
                                 article.quantity * ( article.article.details.price * 100 );
         } );
         resources.cart.sum = resources.cart.sum / 100;
      }

   }

   module.controller( moduleName + '.Controller', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
