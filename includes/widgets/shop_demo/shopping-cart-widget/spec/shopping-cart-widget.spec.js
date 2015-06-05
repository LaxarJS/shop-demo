/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   'json!../bower.json',
   '../shopping-cart-widget',
   'laxar/laxar_testing',
   'laxar-patterns',
   'angular-mocks',
   'jquery',
   'json!./spec_data.json',
   'text!../default.theme/shopping-cart-widget.html'
], function( manifest, widgetModule, ax, patterns, ngMocks, $, cartData, widgetMarkup ) {
   'use strict';

   describe( 'A ShoppingCartWidget', function() {

      var anyFunction = jasmine.any( Function );
      var testBed;
      var $widget;
      var specScope;
      var configuration = {
         cart: {
            resource: 'cart',
            order: {
               action: 'order'
            }
         },
         article: {
            resource: 'selectedArticle',
            onActions: [ 'addArticle' ]
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( manifest.name );
         testBed.featuresMock = features;
         testBed.setup();

         specScope = {
            eventBus: testBed.eventBusMock,
            features: features,
            resources: {}
         };

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
         $widget.remove();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature cart and configured resource', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as a master of the resource and displays the cart', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.cart', anyFunction );
            expect( testBed.scope.resources.cart.entries ).toEqual( [] );
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.cart', {
                  resource: 'cart',
                  data: {
                     entries: [],
                     sum: 0
                  }
               }, {
                  deliverToSender: false
               }
            );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature article and selected article is published ', function() {

         beforeEach( function() {
            setup( configuration );
            patterns.resources.handlerFor( specScope ).registerResourceFromFeature( 'cart' );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            testBed.eventBusMock.publish( 'didReplace.selectedArticle', {
               resource: 'selectedArticle',
               data: cartData.entries[ 0 ].article
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as slave for the resource.', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.selectedArticle', anyFunction );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.selectedArticle', anyFunction );
            expect( testBed.scope.resources.article ).toEqual( cartData.entries[ 0 ].article );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'listens to configured action events.', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'takeActionRequest.addArticle', anyFunction );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the action to add article to cart is triggered', function() {

            beforeEach( function() {
               testBed.eventBusMock.publish( 'takeActionRequest.addArticle', {
                  action: 'addArticle'
               } );
               jasmine.Clock.tick( 0 );
            } );

            ///////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a willTakeAction event', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                     action: 'addArticle'
                  }
               );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'adds the selected article to the cart', function() {
               var selectedArticle = cartData.entries[ 0 ];
               selectedArticle.quantity = 1;
               expect( specScope.resources.cart.entries[ 0 ] ).toEqual( selectedArticle );
            } );

            ///////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a didTakeAction event', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                     action: 'addArticle'
                  }
               );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and the action to add the same article to cart again is triggered', function() {

               beforeEach( function() {
                  testBed.scope.eventBus.publish.reset();
                  testBed.eventBusMock.publish( 'takeActionRequest.addArticle', {
                     action: 'addArticle'
                  } );
                  jasmine.Clock.tick( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'publishes a willTakeAction event', function() {
                  expect( testBed.scope.eventBus.publish )
                     .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                        action: 'addArticle'
                     }
                  );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'adds the same selected article to cart.', function() {
                  var selectedArticle = cartData.entries[ 0 ];
                  selectedArticle.quantity = 2;
                  expect( specScope.resources.cart.entries[ 0 ] ).toEqual( selectedArticle );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'publishes a didTakeAction event', function() {
                  expect( testBed.scope.eventBus.publish )
                     .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                        action: 'addArticle'
                     }
                  );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'and the user increases the quantity of an article in cart', function() {

                  beforeEach( function() {
                     testBed.scope.$digest();
                     $( 'tbody tr:first td:last button:first' ).trigger( 'click' );
                     jasmine.Clock.tick( 0 );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'updates the cart resource accordingly', function() {
                     expect( specScope.resources.cart.entries[ 0 ].quantity ).toEqual( 3 );
                     expect( specScope.resources.cart.sum ).toEqual( 74.97 );
                  } );

               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'and the user reduces the quantity of an article in cart', function() {

                  beforeEach( function() {
                     testBed.scope.$digest();
                     $( 'tbody tr:first td:last button:last' ).trigger( 'click' );
                     jasmine.Clock.tick( 0 );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'updates the cart and publishes an didUpdate event.', function() {
                     expect( specScope.resources.cart.entries[ 0 ].quantity ).toEqual( 1 );
                     expect( specScope.resources.cart.sum ).toEqual( 24.99 );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  describe( 'and the user reduces the quantity of an article again and deletes it from cart', function() {

                     beforeEach( function() {
                        testBed.scope.$digest();
                        $( 'tbody tr:first td:last button:last' ).trigger( 'click' );
                     } );

                     /////////////////////////////////////////////////////////////////////////////////////////

                     it( 'deletes the article if the quantity is 0 and publishes an didReplace event for the cart.', function() {
                        var cart = { entries: [ cartData.entries[ 0 ] ], sum: 0 };
                        cart.entries.splice( 0, 1);
                        expect( testBed.scope.eventBus.publish )
                           .toHaveBeenCalledWith( 'didReplace.cart', {
                              resource: 'cart',
                              data: cart
                           },
                           { deliverToSender : false }
                        );
                     } );

                  } );

               } );

            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with articles in cart and configured resource', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            testBed.eventBusMock.publish( 'didReplace.selectedArticle', {
               resource: 'selectedArticle',
               data: cartData.entries[ 0 ].article
            } );
            jasmine.Clock.tick( 0 );
            testBed.eventBusMock.publish( 'takeActionRequest.addArticle', {
               action: 'addArticle'
            } );
            jasmine.Clock.tick( 0 );
            testBed.scope.eventBus.publish.reset();
            testBed.scope.$digest();
            $( 'button' ).trigger( 'click' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the takeActionRequest for the order action', function() {
            expect( testBed.scope.eventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.order', {
                  action: 'order'
               }  );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'waits for the didTakeAction event of the configured order action.', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didTakeAction.order.SUCCESS', anyFunction );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didTakeAction.order.ERROR', anyFunction );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resets the cart after the action is done successful', function() {
            testBed.eventBusMock.publish( 'willTakeAction.order', {
               action: 'order'
            } );
            testBed.eventBusMock.publish( 'didTakeAction.order.SUCCESS', {
               action: 'order'
            } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.resources.cart.entries.length ).toBe( 0 );
         } );

      } );

   } );

} );
