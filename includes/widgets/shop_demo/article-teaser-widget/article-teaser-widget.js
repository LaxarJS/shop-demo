/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'angular',
   'laxar-patterns',
   'angular-sanitize'
], function( ng, patterns ) {
   'use strict';

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      $scope.resources = {};

      patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'display' );

      $scope.addToCart = function() {
         var actionName = $scope.features.button.action;
         $scope.eventBus.publish( 'takeActionRequest.' + actionName, {
            action: actionName
         } );
      };

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'articleTeaserWidget', [ 'ngSanitize' ] )
      .controller( 'ArticleTeaserWidgetController', Controller );

} );
