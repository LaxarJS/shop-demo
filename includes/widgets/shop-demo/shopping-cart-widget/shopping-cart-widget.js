/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   'angular'
], function( ng ) {
   'use strict';

   Controller.$inject = [ '$scope', 'axEventBus' ];

   function Controller( $scope, eventBus ) {

      $scope.resources = {};
      $scope.cart = [];
      $scope.sum = 0;

      var articleResource = $scope.features.article.resource;
      eventBus.subscribe( 'didReplace.' + articleResource, function( event ) {
         $scope.resources.article = event.data;
      } );

      $scope.features.article.onActions.forEach( function( action ) {
         eventBus.subscribe( 'takeActionRequest.' + action, function() {
            eventBus.publish( 'willTakeAction.' + action, { action: action } );
            if( $scope.resources.article !== null ) {
               addArticleToCart( $scope.resources.article );
            }
            eventBus.publish( 'didTakeAction.' + action, { action: action } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.increaseQuantity = function( item ) {
         ++item.quantity;
         updateSum();
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.decreaseQuantity = function( item ) {
         --item.quantity;
         if( item.quantity === 0 ) {
            $scope.cart.splice( $scope.cart.indexOf( item ), 1 );
         }
         updateSum();
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.placeOrder = function() {
         var target = $scope.features.order.target;
         eventBus.publish( 'navigateRequest.' + target, { target: target } );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function addArticleToCart( article ) {
         var item = itemByArticle( article );
         if( !item ) {
            item = { article: article, quantity: 0 };
            $scope.cart.push( item );
         }
         $scope.increaseQuantity( item );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function itemByArticle( article ) {
         return $scope.cart.filter( function( item ) {
            return article.id === item.article.id;
         } )[ 0 ] || null;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function updateSum() {
         $scope.sum = $scope.cart.reduce( function( acc, item ) {
            return acc + item.quantity * ( item.article.price * 100 );
         }, 0 ) / 100;
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'shoppingCartWidget', [ 'ngSanitize' ] )
      .controller( 'ShoppingCartWidgetController', Controller );

} );
