/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'json!../bower.json',
   '../article-search-box-widget',
   'laxar/laxar_testing',
   'angular-mocks',
   'jquery',
   'pouchdb',
   'json!./spec_data.json'
], function( manifest, widgetModule, ax, ngMocks, $, PouchDb, testData ) {
   'use strict';

   describe( 'A ArticleSearchBoxWidget', function() {

      var testBed;
      var qMock;
      var configuration = {
         resource: 'articles',
         database: {
            pouchDb: {
               'dbId': 'articles'
            }
         }
      };

      var pouchDb = new PouchDb().constructor.prototype;

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( manifest.name );
         testBed.featuresMock = features;
         testBed.setup();
      }

      beforeEach( function() {
         qMock = ax.testing.qMock;
         spyOn( pouchDb, 'query' ).andCallFake( function() {
            return qMock.when( testData.response );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature resource and database with configured pouchDB', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'gets all articles from pouchDB', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.articles', {
                  resource: 'articles',
                  data: { entries: testData.entries }
               } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

     describe( 'if the user searches for "be"', function() {

         beforeEach( function() {
            setup( configuration );

            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
            testBed.scope.eventBus.publish.reset();

            testBed.scope.model.searchTerm = 'be';
            testBed.scope.search();
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'gets the two articles containing "be" in the name or description from pouchDB', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.articles', {
                  resource: 'articles',
                  data: { entries: testData.entries.slice( 0, 2 ) }
               } );
         } );

      } );

   } );

} );
