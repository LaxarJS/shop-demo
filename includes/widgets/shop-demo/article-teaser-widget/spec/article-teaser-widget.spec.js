/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'laxar-react-adapter',
   'json!./spec_data.json'
], function( descriptor, axMocks, axReactAdapter, resourceData ) {
   'use strict';

   describe( 'The article-teaser-widget', function() {

      var features = {
         article: {
            resource: 'article'
         },
         confirmation: {
            action: 'addArticle'
         }
      };

      var widgetDom;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( axMocks.createSetupForWidget( descriptor, { adapter: axReactAdapter } ) );
      beforeEach( function() {
         axMocks.widget.configure( features );
      } );
      beforeEach( axMocks.widget.load );
      beforeEach( function() {
         widgetDom = axMocks.widget.render();
      } );

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature article and configured resource', function() {

         beforeEach( function() {
            axMocks.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: resourceData
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to didReplace events of the article resource', function() {
            expect( axMocks.widget.axEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.article', jasmine.any( Function ) );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature confirmation, when the user adds an article to the cart', function() {

         beforeEach( function() {
            axMocks.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: resourceData
            } );
            axMocks.eventBus.flush();
            widgetDom.querySelector( 'button' ).click();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a corresponding takeActionRequest event', function() {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.addArticle', { action: 'addArticle' } );
         } );

      } );

   } );

} );
