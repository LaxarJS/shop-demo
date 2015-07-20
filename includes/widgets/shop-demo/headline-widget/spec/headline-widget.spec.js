/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-testing'
], function( descriptor, testing ) {
   'use strict';

   describe( 'The HeadlineWidget', function() {

      var widgetDom;

      beforeEach( testing.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'css/headline-widget.css' ]
      } ) );

      beforeEach( function() {
         testing.widget.configure( {
            headline: { htmlText: 'I am here!', level: 2 }
         } );
      } );
      beforeEach( testing.widget.load );
      beforeEach( function() {
         widgetDom = testing.widget.render();
      } );

      afterEach( testing.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays a headline', function() {
         expect( widgetDom.querySelector( 'h2' ).textContent ).toEqual( 'I am here!' );
      } );

   } );

} );
