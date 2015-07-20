/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-testing',
   'json!./spec_data.json'
], function( descriptor, testing, articles ) {
   'use strict';

   describe( 'The ShoppingCartWidget', function() {

      var widgetDom;

      beforeEach( testing.createSetupForWidget( descriptor ) );
      beforeEach( function() {
         testing.widget.configure( {
            article: {
               resource: 'article',
               onActions: [ 'addArticle' ]
            },
            order: {
               target: 'placeOrder'
            }
         } );
      } );
      beforeEach( testing.widget.load );
      beforeEach( function() {
         widgetDom = testing.widget.render();
      } );

      afterEach( testing.tearDown );

      /////////////////////////////////////////////////////////////////////////

      describe( 'with a configured article', function() {

         beforeEach( function() {
            testing.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: articles[ 0 ]
            } );
            testing.eventBus.flush();
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'subscribes to the article resource.', function() {
            expect( testing.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
               'didReplace.article',
               jasmine.any( Function ) );

            expect( testing.widget.$scope.resources.article )
               .toEqual( articles[ 0 ] );
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'listens to configured action events.', function() {
            expect( testing.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
               'takeActionRequest.addArticle',
               jasmine.any( Function )
            );
         } );

         //////////////////////////////////////////////////////////////////////

         describe( 'when the article action was triggered', function() {

            beforeEach( function() {
               testing.eventBus.publish( 'takeActionRequest.addArticle', {
                  action: 'addArticle'
               } );
               testing.eventBus.flush();
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'publishes a willTakeAction event', function() {
               expect( testing.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                     action: 'addArticle'
                  } );
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'adds the new article to the cart', function() {
               var firstItem = testing.widget.$scope.cart[ 0 ];
               expect( firstItem.article ).toEqual( articles[ 0 ] );
               expect( firstItem.quantity ).toBe( 1 );
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'publishes a didTakeAction event', function() {
               expect( testing.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                     action: 'addArticle'
                  } );
            } );

            ///////////////////////////////////////////////////////////////////

            describe( 'and then triggered again', function() {

               beforeEach( function() {
                  testing.eventBus
                     .publish( 'takeActionRequest.addArticle', {
                        action: 'addArticle'
                     } );
                  testing.eventBus.flush();
               } );

               ////////////////////////////////////////////////////////////////

               it( 'publishes a willTakeAction event', function() {
                  expect( testing.widget.axEventBus.publish )
                     .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                        action: 'addArticle'
                     } );
               } );

               ////////////////////////////////////////////////////////////////

               it( 'increases the quantity', function() {
                  expect( testing.widget.$scope.cart[ 0 ].quantity ).toBe( 2 );
               } );

               ////////////////////////////////////////////////////////////////

               it( 'publishes a didTakeAction event', function() {
                  expect( testing.widget.axEventBus.publish )
                     .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                        action: 'addArticle'
                     } );
               } );

               ////////////////////////////////////////////////////////////////

               describe( 'when the user increases the quantity', function() {

                  beforeEach( function() {
                     var increaseButton = widgetDom.querySelector(
                        'tbody tr:first-child td:last-child button:first-child'
                     );
                     increaseButton.click();
                  } );

                  /////////////////////////////////////////////////////////////

                  it( 'updates the sum accordingly', function() {
                     expect( testing.widget.$scope.sum ).toEqual( 74.97 );
                  } );

               } );

               ////////////////////////////////////////////////////////////////

               describe( 'when the user decreases the quantity', function() {
                  var decreaseButton;
                  beforeEach( function() {
                     decreaseButton = widgetDom.querySelector(
                        'tbody tr:first-child td:last-child button:last-child'
                     );
                     decreaseButton.click();
                  } );

                  /////////////////////////////////////////////////////////////

                  it( 'updates the sum accordingly', function() {
                     expect( testing.widget.$scope.sum ).toEqual( 24.99 );
                  } );

                  /////////////////////////////////////////////////////////////

                  it( 'removes one item from the cart', function() {
                     expect( testing.widget.$scope.cart[ 0 ].quantity ).toBe( 1 );
                  } );

                  /////////////////////////////////////////////////////////////

                  describe( 'and decreases it again', function() {

                     beforeEach( function() {
                        decreaseButton.click();
                     } );

                     //////////////////////////////////////////////////////////

                     it( 'deletes the article from the cart', function() {
                        expect( testing.widget.$scope.cart.length ).toBe( 0 );
                     } );

                  } );

               } );

            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////


      describe( 'with feature order', function() {

         beforeEach( function() {
            testing.widget.$scope.cart = [
               {
                  article: articles[0],
                  quantity: 1
               },
               {
                  article: articles[1],
                  quantity: 4
               }
            ];
            testing.widget.$scope.$digest();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the user clicks the order button', function() {

            beforeEach( function() {
               widgetDom.querySelector( 'button.btn-success' ).click();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'triggers a navigateRequest with the configured target', function() {
               expect( testing.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'navigateRequest.placeOrder',{
                     target: 'placeOrder'
                  } );
            } );

         } );

      } );

   } );

} );
