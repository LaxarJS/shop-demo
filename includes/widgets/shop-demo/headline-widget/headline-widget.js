/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'angular'
], function( ng ) {
   'use strict';

   Controller.$inject = [];

   function Controller() {

      // The features of this widget are directly bound within the template. Thus the controller needs no code

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'headlineWidget', [] ).controller( 'HeadlineWidgetController', Controller );

} );
