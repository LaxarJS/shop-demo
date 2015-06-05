/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'json!../bower.json',
   '../article-teaser-widget',
   'laxar/laxar_testing',
   'angular-mocks',
   'jquery',
   'json!./spec_data.json',
   'text!../default.theme/article-teaser-widget.html'
], function( manifest, widgetModule, ax, ngMocks, $, resourceData, widgetMarkup  ) {
   'use strict';

   describe( 'A ArticleTeaserWidget', function() {

      var anyFunction = jasmine.any( Function );
      var testBed;
      var $widget;
      var configuration = {
         display: {
            resource: 'article'
         },
         button: {
            htmlLabel: 'Add to Cart',
            action: 'addArticle'
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( manifest.name );
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature display and configured resource', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'didReplace.article', {
                  resource: 'article',
                  data: resourceData
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as a slave of the resource and displays the details.', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.article', anyFunction );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.article', anyFunction );
            expect( testBed.scope.resources.display ).toEqual( resourceData );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and an update of the article resource', function() {

            beforeEach( function() {
               testBed.eventBusMock.publish( 'didUpdate.article', {
                  resource: 'article',
                  patches: [
                     {
                        op: 'replace',
                        path: '/details/price',
                        value: 19.99
                     }
                  ]
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'reflects updates to the published resource', function() {
               expect( testBed.scope.resources.display.details.price ).toEqual( 19.99 );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature button and user adds an article to cart', function() {

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

         it( 'publishes a takeActionRequest to add the selected article to cart', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.addArticle', {
                  action: 'addArticle'
               }
            );
         } );

      } );

   } );

} );
