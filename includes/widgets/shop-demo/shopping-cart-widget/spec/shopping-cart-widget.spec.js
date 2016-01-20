/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'json!./spec_data.json'
], function( descriptor, axMocks, articles ) {
   'use strict';

   describe( 'The ShoppingCartWidget', function() {

      var widgetDom;

      beforeEach( axMocks.createSetupForWidget( descriptor ) );
      beforeEach( function() {
         axMocks.widget.configure( {
            article: {
               resource: 'article',
               onActions: [ 'addArticle' ]
            },
            order: {
               target: 'placeOrder'
            }
         } );
      } );
      beforeEach( axMocks.widget.load );
      beforeEach( function() {
         widgetDom = axMocks.widget.render();
      } );

      afterEach( axMocks.tearDown );

      /////////////////////////////////////////////////////////////////////////

      describe( 'with a configured article', function() {

         beforeEach( function() {
            axMocks.eventBus.publish( 'didReplace.article', {
               resource: 'article',
               data: articles[ 0 ]
            } );
            axMocks.eventBus.flush();
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'subscribes to the article resource.', function() {
            expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
               'didReplace.article',
               jasmine.any( Function ) );

            expect( axMocks.widget.$scope.resources.article )
               .toEqual( articles[ 0 ] );
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'listens to configured action events.', function() {
            expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
               'takeActionRequest.addArticle',
               jasmine.any( Function )
            );
         } );

         //////////////////////////////////////////////////////////////////////

         describe( 'when the article action was triggered', function() {

            beforeEach( function() {
               axMocks.eventBus.publish( 'takeActionRequest.addArticle', {
                  action: 'addArticle'
               } );
               axMocks.eventBus.flush();
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'publishes a willTakeAction event', function() {
               expect( axMocks.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                     action: 'addArticle'
                  } );
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'adds the new article to the cart', function() {
               var firstItem = axMocks.widget.$scope.cart[ 0 ];
               expect( firstItem.article ).toEqual( articles[ 0 ] );
               expect( firstItem.quantity ).toBe( 1 );
            } );

            ///////////////////////////////////////////////////////////////////

            it( 'publishes a didTakeAction event', function() {
               expect( axMocks.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                     action: 'addArticle'
                  } );
            } );

            ///////////////////////////////////////////////////////////////////

            describe( 'and then triggered again', function() {

               beforeEach( function() {
                  axMocks.eventBus
                     .publish( 'takeActionRequest.addArticle', {
                        action: 'addArticle'
                     } );
                  axMocks.eventBus.flush();
               } );

               ////////////////////////////////////////////////////////////////

               it( 'publishes a willTakeAction event', function() {
                  expect( axMocks.widget.axEventBus.publish )
                     .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                        action: 'addArticle'
                     } );
               } );

               ////////////////////////////////////////////////////////////////

               it( 'increases the quantity', function() {
                  expect( axMocks.widget.$scope.cart[ 0 ].quantity ).toBe( 2 );
               } );

               ////////////////////////////////////////////////////////////////

               it( 'publishes a didTakeAction event', function() {
                  expect( axMocks.widget.axEventBus.publish )
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
                     expect( axMocks.widget.$scope.sum ).toEqual( 74.97 );
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
                     expect( axMocks.widget.$scope.sum ).toEqual( 24.99 );
                  } );

                  /////////////////////////////////////////////////////////////

                  it( 'removes one item from the cart', function() {
                     expect( axMocks.widget.$scope.cart[ 0 ].quantity ).toBe( 1 );
                  } );

                  /////////////////////////////////////////////////////////////

                  describe( 'and decreases it again', function() {

                     beforeEach( function() {
                        decreaseButton.click();
                     } );

                     //////////////////////////////////////////////////////////

                     it( 'deletes the article from the cart', function() {
                        expect( axMocks.widget.$scope.cart.length ).toBe( 0 );
                     } );

                  } );

               } );

            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////


      describe( 'with feature order', function() {

         beforeEach( function() {
            axMocks.widget.$scope.cart = [
               {
                  article: articles[0],
                  quantity: 1
               },
               {
                  article: articles[1],
                  quantity: 4
               }
            ];
            axMocks.widget.$scope.$digest();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the user clicks the order button', function() {

            beforeEach( function() {
               widgetDom.querySelector( 'button.btn-success' ).click();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'triggers a navigateRequest with the configured target', function() {
               expect( axMocks.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'navigateRequest.placeOrder',{
                     target: 'placeOrder'
                  } );
            } );

         } );

      } );

   } );

} );
