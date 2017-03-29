/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/* global define */
define( [
   'laxar-mocks',
   'laxar-react-adapter',
   './spec_data.json'
], ( axMocks, axReactAdapter, resourceData ) => {
   'use strict';

   describe( 'The article-teaser-widget', () => {

      let widgetDom;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( axMocks.setupForWidget() );
      beforeEach( () => {
         axMocks.widget.configure( {
            article: {
               resource: 'article'
            },
            confirmation: {
               action: 'addArticle'
            }
         } );
      } );
      beforeEach( axMocks.widget.load );
      beforeEach( () => {
         widgetDom = axMocks.widget.render();
      } );

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature article and configured resource', () => {

         beforeEach( () => {
            axMocks.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: resourceData
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to didReplace events of the article resource', () => {
            expect( axMocks.widget.axEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.article', jasmine.any( Function ) );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature confirmation, when the user adds an article to the cart', () => {

         beforeEach( () => {
            axMocks.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: resourceData
            } );
            axMocks.eventBus.flush();
            widgetDom.querySelector( 'button' ).click();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a corresponding takeActionRequest event', () => {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.addArticle', { action: 'addArticle' } );
         } );

      } );

   } );

} );
