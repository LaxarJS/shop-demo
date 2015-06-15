/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   '../article-browser-widget',
   'laxar/laxar_testing',
   'json!./spec_data.json'
], function( widgetModule, ax, resourceData ) {
   'use strict';

   describe( 'A ArticleBrowserWidget', function() {

      var anyFunction = jasmine.any( Function );
      var testBed;
      var data;
      var defaultFeatures = {
         articles: {
            resource: 'articles'
         },
         selection: {
            resource: 'selectedArticle'
         }
      };

      function setup( features ) {
         data = ax.object.deepClone( resourceData );
         testBed = ax.testing.portalMocksAngular
            .createControllerTestBed( 'shop-demo/article-browser-widget' );
         testBed.featuresMock = features;
         testBed.setup();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didReplace events of the articles resource', function() {
         setup( defaultFeatures );
         expect( testBed.scope.eventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.articles', anyFunction );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the list of articles is replaced', function() {

         beforeEach( function() {
            setup( defaultFeatures );
            testBed.eventBusMock.publish( 'didReplace.articles', {
               resource: 'articles',
               data: data
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resets the article selection', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                  resource: 'selectedArticle',
                  data: null
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the user selects an article', function() {

            beforeEach( function() {
               testBed.scope.eventBus.publish.reset();
               testBed.scope.selectArticle( testBed.scope.resources.articles[ 1 ] );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the configured selection resource is replaced', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                     resource: 'selectedArticle',
                     data: testBed.scope.resources.articles[ 1 ]
                  } );
            } );

         } );

      } );

   } );

} );
