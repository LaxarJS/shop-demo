/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'laxar',
   'json!./spec_data.json'
], function( descriptor, axMocks, ax, resourceData ) {
   'use strict';

   describe( 'A ArticleSearchBoxWidget', function() {

      var data;
      var widgetEventBus;
      var widgetScope;
      var testEventBus;

      beforeEach( axMocks.createSetupForWidget( descriptor ) );
      beforeEach( function() {
         axMocks.widget.configure( {
            articles: {
               resource: 'articles'
            },
            filteredArticles: {
               resource: 'filteredArticles'
            }
         } );
      } );
      beforeEach( axMocks.widget.load );
      beforeEach( function() {
         data = ax.object.deepClone( resourceData );
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when articles were published without given search term', function() {

         beforeEach( function() {
            testEventBus.publish( 'didReplace.articles', {
               resource: 'articles',
               data: data
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the same list as filtered articles', function() {
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.filteredArticles', {
               resource: 'filteredArticles',
               data: data
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and a search was initiated afterwards', function() {

            beforeEach( function() {
               // testBed.scope.eventBus.publish.reset();
               widgetScope.model.searchTerm = 'beer';
               widgetScope.search();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes the matching articles only', function() {
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.filteredArticles', {
                  resource: 'filteredArticles',
                  data: {
                     entries: [ data.entries[ 1 ] ]
                  }
               } );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when articles were published with already given search term', function() {

         beforeEach( function() {
            widgetScope.model.searchTerm = 'beer';
            testEventBus.publish( 'didReplace.articles', {
               resource: 'articles',
               data: data
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the matching articles only', function() {
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.filteredArticles', {
               resource: 'filteredArticles',
               data: {
                  entries: [ data.entries[ 1 ] ]
               }
            } );
         } );

      } );

   } );

} );
