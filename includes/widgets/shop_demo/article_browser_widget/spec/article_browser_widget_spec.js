/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   '../article_browser_widget',
   'laxar/laxar_testing',
   'angular-mocks',
   'jquery',
   'json!./spec_data.json',
   'text!../default.theme/article_browser_widget.html'
], function( widgetModule, ax, ngMocks, $, resourceData, widgetMarkup ) {
   'use strict';

   describe( 'A ArticleBrowserWidget', function() {

      var anyFunction = jasmine.any( Function );
      var testBed;
      var $widget;
      var configuration = {
         display: {
            resource: 'articles'
         },
         select: {
            resource: 'selectedArticle'
         }
      };

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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature display and configured resource', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            testBed.eventBusMock.publish( 'didReplace.articles', {
               resource: 'articles',
               data: resourceData
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as a slave of the resource and displays the list of articles', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.articles', anyFunction );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.articles', anyFunction );
            expect( testBed.scope.resources.display ).toEqual( resourceData );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and an update of the articles resource', function() {

            beforeEach( function() {
               testBed.eventBusMock.publish( 'didUpdate.articles', {
                  resource: 'articles',
                  patches: [
                     {
                        op: 'replace',
                        path: '/entries/1/details/price',
                        value: 19.99
                     }
                  ]
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'reflects updates to the published resource', function() {
               expect( testBed.scope.resources.display.entries[ 1 ].details.price ).toEqual( 19.99 );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature select and user selects an article', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            testBed.eventBusMock.publish( 'didReplace.articles', {
               resource: 'articles',
               data: resourceData
            } );
            jasmine.Clock.tick( 0 );
            testBed.scope.$digest();

            $( 'tr:last td:first' ).trigger( 'click' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the resource with the selected article', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                  resource: 'selectedArticle',
                  data: resourceData.entries[ 2 ]
               }, {
                  deliverToSender: false
               }
            );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         var articles = {
            'null': null,
            'undefined': undefined,
            'empty list': { entries: [] },
            'list with other articles': { entries: resourceData.entries[ 1 ] }
         };

         ax.object.forEach( articles, function ( articlesData, description ) {

            describe( 'and a replace of the articles resource (' + description + ') without the selected article', function() {

               beforeEach( function() {
                  testBed.eventBusMock.publish( 'didReplace.articles', {
                     resource: 'articles',
                     data: articlesData
                  } );
                  jasmine.Clock.tick( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'sets the selected article to null and publishes a didReplace event for it', function() {
                  expect( testBed.scope.selectedArticle ).toEqual( null );
                  expect( testBed.scope.eventBus.publish )
                     .toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                        resource: 'selectedArticle',
                        data: null
                     }, {
                        deliverToSender: false
                     }
                  );
               } );

            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and an update of the articles resource which removes the selected article', function() {

            beforeEach( function() {
               testBed.eventBusMock.publish( 'didUpdate.articles', {
                  resource: 'articles',
                  patches: [
                     {
                        op: 'remove',
                        path: '/entries/2'
                     }
                  ]
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sets the selected article to null and publishes a didReplace event for it', function() {
               expect( testBed.scope.selectedArticle ).toEqual( null );
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                     resource: 'selectedArticle',
                     data: null
                  }, {
                     deliverToSender: false
                  }
               );
            } );

         } );

      } );

   } );

} );
