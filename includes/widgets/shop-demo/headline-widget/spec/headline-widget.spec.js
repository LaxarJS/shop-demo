/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'json!../bower.json',
   '../headline-widget',
   'laxar/laxar_testing'
], function( manifest, widgetModule, ax ) {
   'use strict';

   describe( 'A HeadlineWidget', function() {

      var testBed_;

      beforeEach( function setup() {
         testBed_ = ax.testing.portalMocksAngular.createControllerTestBed( manifest.name );
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
