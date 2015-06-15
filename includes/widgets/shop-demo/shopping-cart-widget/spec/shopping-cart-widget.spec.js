/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   '../shopping-cart-widget',
   'laxar/laxar_testing',
   'angular-mocks',
   'jquery',
   'json!./spec_data.json',
   'text!../default.theme/shopping-cart-widget.html'
], function( widgetModule, ax, ngMocks, $, articles, widgetMarkup ) {
   'use strict';

   describe( 'A ShoppingCartWidget', function() {

      var testBed;
      var configuration = {
         article: {
            resource: 'article',
            onActions: [ 'addArticle' ]
         },
         order: {
            target: 'placeOrder'
         }
      };

      /////////////////////////////////////////////////////////////////////////

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular
            .createControllerTestBed( 'shop-demo/shopping-cart-widget' );
         testBed.featuresMock = features;
         testBed.setup();

         ngMocks.inject( function( $compile ) {
            var $widget = $( '<div id="container"></div>' )
               .html( widgetMarkup );
            $compile( $widget )( testBed.scope );
            $widget.appendTo( 'body' );
         } );
      }

      /////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
         $( '#container' ).remove();
      } );

      /////////////////////////////////////////////////////////////////////////

      describe( 'with feature article, and a published article', function() {

         beforeEach( function() {
            setup( configuration );

            testBed.eventBusMock.publish( 'didReplace.article', {
               resource: 'article',
               data: articles[ 0 ]
            } );
            jasmine.Clock.tick( 0 );
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'subscribes to the resource.', function() {
            expect( testBed.scope.eventBus.subscribe ).toHaveBeenCalledWith(
               'didReplace.article',
               jasmine.any( Function )
            );
            expect( testBed.scope.resources.article ).toEqual( articles[ 0 ] );
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'listens to configured action events.', function() {
            expect( testBed.scope.eventBus.subscribe ).toHaveBeenCalledWith(
               'takeActionRequest.addArticle',
               jasmine.any( Function )
            );
         } );

         //////////////////////////////////////////////////////////////////////

         describe( 'when the article action was triggered', function() {

            beforeEach( function() {
               testBed.eventBusMock.publish( 'takeActionRequest.addArticle', {
                  action: 'addArticle'
               } );
               jasmine.Clock.tick( 0 );
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'publishes a willTakeAction event', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                     action: 'addArticle'
                  }
               );
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'adds the new article to the cart', function() {
               var firstItem = testBed.scope.cart[ 0 ];
               expect( firstItem.article ).toEqual( articles[ 0 ] );
               expect( firstItem.quantity ).toBe( 1 );
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'publishes a didTakeAction event', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                     action: 'addArticle'
                  }
               );
            } );

            ///////////////////////////////////////////////////////////////////

            describe( 'and then triggered again', function() {

               beforeEach( function() {
                  testBed.scope.eventBus.publish.reset();
                  testBed.eventBusMock
                     .publish( 'takeActionRequest.addArticle', {
                        action: 'addArticle'
                     } );
                  jasmine.Clock.tick( 0 );
               } );

               ////////////////////////////////////////////////////////////////

               it( 'publishes a willTakeAction event', function() {
                  expect( testBed.scope.eventBus.publish )
                     .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                        action: 'addArticle'
                     }
                  );
               } );

               ////////////////////////////////////////////////////////////////

               it( 'increases the quantity', function() {
                  expect( testBed.scope.cart[ 0 ].quantity ).toBe( 2 );
               } );

               ////////////////////////////////////////////////////////////////

               it( 'publishes a didTakeAction event', function() {
                  expect( testBed.scope.eventBus.publish )
                     .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                        action: 'addArticle'
                     }
                  );
               } );

               ////////////////////////////////////////////////////////////////

               describe( 'when the user increases the quantity', function() {

                  beforeEach( function() {
                     $( 'tbody tr:first td:last button:first' )
                        .trigger( 'click' );
                     jasmine.Clock.tick( 0 );
                  } );

                  /////////////////////////////////////////////////////////////

                  it( 'updates the sum accordingly', function() {
                     expect( testBed.scope.sum ).toEqual( 74.97 );
                  } );

               } );

               ////////////////////////////////////////////////////////////////

               describe( 'when the user decreases the quantity', function() {

                  beforeEach( function() {
                     $( 'tbody tr:first td:last button:last' )
                        .trigger( 'click' );
                     jasmine.Clock.tick( 0 );
                  } );

                  /////////////////////////////////////////////////////////////

                  it( 'updates the sum accordingly', function() {
                     expect( testBed.scope.sum ).toEqual( 24.99 );
                  } );

                  /////////////////////////////////////////////////////////////

                  it( 'removes one item from the cart', function() {
                     expect( testBed.scope.cart[ 0 ].quantity ).toBe( 1 );
                  } );

                  /////////////////////////////////////////////////////////////

                  describe( 'and decreases it again', function() {

                     beforeEach( function() {
                        $( 'tbody tr:first td:last button:last' )
                           .trigger( 'click' );
                     } );

                     //////////////////////////////////////////////////////////

                     it( 'deletes the article from the cart', function() {
                        expect( testBed.scope.cart.length ).toBe( 0 );
                     } );

                  } );

               } );

            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature order', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.scope.cart = [
               {
                  article: articles[0],
                  quantity: 1
               },
               {
                  article: articles[1],
                  quantity: 4
               }
            ];
            testBed.scope.$digest();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the user clicks the order button', function() {

            beforeEach( function() {
               $( '#container' ).find( 'button.btn-success' ).click();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'triggers a navigateRequest with the configured target', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'navigateRequest.placeOrder',{
                     target: 'placeOrder'
                  } );
            } );

         } );

      } );

   } );

} );
