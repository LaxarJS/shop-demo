/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   '../article-teaser-widget',
   'laxar/laxar_testing',
   'angular-mocks',
   'jquery',
   'json!./spec_data.json',
   'text!../default.theme/article-teaser-widget.html'
], function( widgetModule, ax, ngMocks, $, resourceData, widgetMarkup  ) {
   'use strict';

   describe( 'A ArticleTeaserWidget', function() {

      var anyFunction = jasmine.any( Function );
      var testBed;
      var $widget;
      var configuration = {
         article: {
            resource: 'article'
         },
         confirmation: {
            action: 'addArticle'
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( 'shop-demo/article-teaser-widget' );
         testBed.featuresMock = features;
         testBed.setup();

         ngMocks.inject( function( $compile ) {
            $( '#container' ).remove();
            $widget = $( '<div id="container"></div>' ).html( widgetMarkup );
            $compile( $widget )( testBed.scope );
            $widget.appendTo( 'body' );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature article and configured resource', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'didReplace.article', {
                  resource: 'article',
                  data: resourceData
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to didReplace events of the article resource', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.article', anyFunction );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature confirmation, when the user adds an article to the cart', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'didReplace.article', {
               resource: 'article',
               data: resourceData
            } );
            jasmine.Clock.tick( 0 );
            $( 'button' ).trigger( 'click' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes an according takeActionRequest event', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.addArticle', {
                  action: 'addArticle'
               }
            );
         } );

      } );

   } );

} );
