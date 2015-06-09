/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   '../headline-widget',
   'laxar/laxar_testing'
], function(  widgetModule, ax ) {
   'use strict';

   describe( 'A HeadlineWidget', function() {

      var testBed_;

      beforeEach( function setup() {
         testBed_ = ax.testing.portalMocksAngular.createControllerTestBed( 'shop-demo/headline-widget' );
         testBed_.featuresMock = {};
         testBed_.setup();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed_.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does nothing that needs to be tested' );

   } );

} );
