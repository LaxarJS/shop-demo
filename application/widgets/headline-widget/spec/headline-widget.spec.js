/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

// Just as an example, here is an AMD-based spec test.
/* global define */
define( [
   'laxar-mocks'
], axMocks => {
   'use strict';

   describe( 'The headline-widget', () => {

      let widgetDom;

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( {
            headline: { htmlText: 'I am here!' },
            intro: { htmlText: 'For more information, read this!' }
         } );
      } );
      beforeEach( axMocks.widget.load );
      beforeEach( () => {
         widgetDom = axMocks.widget.render();
      } );

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays a headline', () => {
         expect( widgetDom.querySelector( 'h2' ).textContent ).toEqual( 'I am here!' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays an intro text', () => {
         expect( widgetDom.querySelector( 'p' ).textContent ).toEqual( 'For more information, read this!' );
      } );

   } );

} );
