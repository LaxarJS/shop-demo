/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks'
], function( descriptor, axMocks ) {
   'use strict';

   describe( 'The headline-widget', function() {

      var widgetDom;

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'css/headline-widget.css' ]
      } ) );

      beforeEach( function() {
         axMocks.widget.configure( {
            headline: { htmlText: 'I am here!', level: 2 }
         } );
      } );
      beforeEach( axMocks.widget.load );
      beforeEach( function() {
         widgetDom = axMocks.widget.render();
      } );

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays a headline', function() {
         expect( widgetDom.querySelector( 'h1' ).textContent ).toEqual( 'I am here!' );
      } );

   } );

} );
