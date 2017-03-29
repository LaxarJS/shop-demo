/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';

import articles from './spec_data.json';

describe( 'The ShoppingCartWidget', () => {

   beforeEach( axMocks.setupForWidget() );
   beforeEach( () => {
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

   let widgetDom;
   beforeEach( () => { widgetDom = axMocks.widget.render(); } );
   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured article', () => {

      beforeEach( () => {
         axMocks.eventBus.publish( 'didReplace.article', {
            resource: 'article',
            data: articles[ 0 ]
         } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to the article resource.', () => {
         expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
            'didReplace.article',
            jasmine.any( Function ) );

         expect( axMocks.widget.axContext.article )
            .toEqual( articles[ 0 ] );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'listens to configured action events.', () => {
         expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
            'takeActionRequest.addArticle',
            jasmine.any( Function )
         );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the article action was triggered', () => {

         beforeEach( () => {
            axMocks.eventBus.publish( 'takeActionRequest.addArticle', {
               action: 'addArticle'
            } );
            axMocks.eventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a willTakeAction event', () => {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                  action: 'addArticle'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'adds the new article to the cart', () => {
            const firstItem = axMocks.widget.axContext.cart[ 0 ];
            expect( firstItem.article ).toEqual( articles[ 0 ] );
            expect( firstItem.quantity ).toBe( 1 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a didTakeAction event', () => {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                  action: 'addArticle'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and then triggered again', () => {

            beforeEach( () => {
               axMocks.eventBus
                  .publish( 'takeActionRequest.addArticle', {
                     action: 'addArticle'
                  } );
               axMocks.eventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a willTakeAction event', () => {
               expect( axMocks.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'willTakeAction.addArticle', {
                     action: 'addArticle'
                  } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'increases the quantity', () => {
               expect( axMocks.widget.axContext.cart[ 0 ].quantity ).toBe( 2 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a didTakeAction event', () => {
               expect( axMocks.widget.axEventBus.publish )
                  .toHaveBeenCalledWith( 'didTakeAction.addArticle', {
                     action: 'addArticle'
                  } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when the user increases the quantity', () => {

               beforeEach( () => {
                  const increaseButton = widgetDom.querySelector(
                     'tbody tr:first-child td:last-child button:first-child'
                  );
                  increaseButton.click();
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'updates the sum accordingly', () => {
                  expect( axMocks.widget.axContext.sum ).toEqual( 74.97 );
               } );

            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when the user decreases the quantity', () => {
               let decreaseButton;
               beforeEach( () => {
                  decreaseButton = widgetDom.querySelector(
                     'tbody tr:first-child td:last-child button:last-child'
                  );
                  decreaseButton.click();
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'updates the sum accordingly', () => {
                  expect( axMocks.widget.axContext.sum ).toEqual( 24.99 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'removes one item from the cart', () => {
                  expect( axMocks.widget.axContext.cart[ 0 ].quantity ).toBe( 1 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'and decreases it again', () => {

                  beforeEach( () => {
                     decreaseButton.click();
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'deletes the article from the cart', () => {
                     expect( axMocks.widget.axContext.cart.length ).toBe( 0 );
                  } );

               } );

            } );

         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////


   describe( 'with feature order', () => {

      beforeEach( () => {
         axMocks.widget.axContext.cart = [
            {
               article: articles[ 0 ],
               quantity: 1
            },
            {
               article: articles[ 1 ],
               quantity: 4
            }
         ];
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and the user clicks the order button', () => {

         beforeEach( () => {
            widgetDom.querySelector( 'button.btn-success' ).click();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'triggers a navigateRequest with the configured target', () => {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'navigateRequest.placeOrder', {
                  target: 'placeOrder'
               } );
         } );

      } );

   } );

} );
