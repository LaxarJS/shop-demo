/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   '../article-search-box-widget',
   'laxar/laxar_testing',
   'json!./spec_data.json'
], function( widgetModule, ax, testData ) {
   'use strict';

   describe( 'A ArticleSearchBoxWidget', function() {

      var testBed;
      var data;

      beforeEach( function() {
         data = ax.object.deepClone( testData );
         testBed = ax.testing.portalMocksAngular
            .createControllerTestBed( 'shop-demo/article-search-box-widget' );
         testBed.featuresMock = {
            articles: {
               resource: 'articles'
            },
            filteredArticles: {
               resource: 'filteredArticles'
            }
         };
         testBed.setup();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when articles were published without given search term', function() {

         beforeEach( function() {
            testBed.eventBusMock.publish( 'didReplace.articles', {
               resource: 'articles',
               data: data
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the same list as filtered articles', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.filteredArticles', {
                  resource: 'filteredArticles',
                  data: data
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and a search was initiated afterwards', function() {

            beforeEach( function() {
               testBed.scope.eventBus.publish.reset();
               testBed.scope.model.searchTerm = 'beer';
               testBed.scope.search();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes the matching articles only', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.filteredArticles', {
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
            testBed.scope.model.searchTerm = 'beer';
            testBed.eventBusMock.publish( 'didReplace.articles', {
               resource: 'articles',
               data: data
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the matching articles only', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.filteredArticles', {
                  resource: 'filteredArticles',
                  data: {
                     entries: [ data.entries[ 1 ] ]
                  }
               } );
         } );

      } );

   } );

} );
