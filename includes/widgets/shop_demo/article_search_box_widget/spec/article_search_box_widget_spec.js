/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   '../article_search_box_widget',
   'laxar/laxar_testing',
   'angular-mocks',
   'jquery',
   'pouchdb',
   'json!./spec_data.json',
   'text!../default.theme/article_search_box_widget.html'
], function( widgetModule, ax, ngMocks, $, PouchDb, testData, widgetMarkup ) {
   'use strict';

   describe( 'A ArticleSearchBoxWidget', function() {

      var testBed;
      var $widget;
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
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( widgetModule.name );
         testBed.featuresMock = features;
         testBed.useWidgetJson();
         testBed.setup();

         ngMocks.inject( function( $compile ) {
            $( '#container' ).remove();
            $widget = $( '<div id="container"></div>' ).html( widgetMarkup );
            $compile( $widget )( testBed.scope );
            $widget.appendTo( 'body' );
         } );
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
            testBed.scope.$digest();
            $( 'button' ).trigger( 'click' );
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
