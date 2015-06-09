/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   '../dummy-articles-activity',
   'laxar/laxar_testing',
   '../articles'
], function( widgetModule, ax, articles ) {
   'use strict';

   describe( 'A DummyArticlesActivity', function() {

      var testBed;

      beforeEach( function setup() {
         testBed = ax.testing.portalMocksAngular
            .createControllerTestBed( 'shop-demo/dummy-articles-activity' );
         testBed.featuresMock = {
            articles: {
               resource: 'articles'
            }
         };
         testBed.setup();
      } );

      /////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      /////////////////////////////////////////////////////////////////////////

      describe( 'on beginLifecycleRequest', function() {

         beforeEach( function() {
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'publishes some dummy articles', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.articles', {
                  resource: 'articles',
                  data: {
                     entries: articles.map( function( article ) {
                        article.pictureUrl = article.picture ?
                           jasmine.any( String ) : null;
                        return article;
                     } )
                  }
               } );
         } );

      } );

   } );
} );
