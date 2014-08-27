/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'angular',
   'laxar_patterns',
   'angular-sanitize'
], function( ng, patterns ) {
   'use strict';

   var moduleName = 'widgets.shop_demo.article_teaser_widget';
   var module     = ng.module( moduleName, [ 'ngSanitize' ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

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

   module.controller( moduleName + '.Controller', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
