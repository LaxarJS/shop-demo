/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'angular'
], function( ng ) {
   'use strict';

   var moduleName = 'widgets.shop_demo.headline_widget';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      // The features of this widget are directly bound within the template. Thus the controller needs no code

   }

   module.controller( moduleName + '.Controller', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
