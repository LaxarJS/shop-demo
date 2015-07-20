/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-testing',
   'json!./spec_data.json'
], function( descriptor, testing, resourceData ) {
   'use strict';

   describe( 'The ArticleTeaserWidget', function() {

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

      beforeEach( testing.createSetupForWidget( descriptor ) );
      beforeEach( function() {
         testing.widget.configure( features );
      } );
      beforeEach( testing.widget.load );
      beforeEach( function() {
         widgetDom = testing.widget.render();
      } );

      afterEach( testing.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature article and configured resource', function() {

         beforeEach( function() {
            testing.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: resourceData
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to didReplace events of the article resource', function() {
            expect( testing.widget.axEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.article', jasmine.any( Function ) );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature confirmation, when the user adds an article to the cart', function() {

         beforeEach( function() {
            testing.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: resourceData
            } );
            testing.eventBus.flush();
            widgetDom.querySelector( 'button' ).click();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a corresponding takeActionRequest event', function() {
            expect( testing.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.addArticle', { action: 'addArticle' } );
         } );

      } );

   } );

} );
