<template>
<div>
   <h3 class="ax-function-point"
      :class="{ 'app-articles': !isEmpty }">
      <i class="fa fa-shopping-cart"></i>
      Shopping Cart
   </h3>
   <table class="table table-striped" :class="{ 'app-articles': !isEmpty }">
      <colgroup>
         <col class="app-col-1">
         <col class="app-col-2">
         <col class="app-col-3">
         <col class="app-col-4">
         <col class="app-col-5">
      </colgroup>
      <thead>
         <tr class="app-no-articles-row" :class="{ 'hidden': !isEmpty }">
            <th class="app-no-articles" colspan="5">
               Please select articles to add them to the cart!
            </th>
         </tr>
         <tr class="app-articles-row" :class="{ 'hidden': isEmpty }">
            <th>Art. ID</th>
            <th>Article</th>
            <th class="text-right">Price</th>
            <th class="text-right" colspan="2">Quantity</th>
         </tr>
      </thead>
      <tbody class="app-articles-container">
         <tr v-for="item in cart">
            <td class="app-col-1">{{ item.article.id }}</td>
            <td>{{ item.article.name }}</td>
            <td class="text-right">{{ format( item.article.price ) }}</td>
            <td class="text-right app-increase-quantity">{{ item.quantity }}</td>
            <td class="app-increase-buttons">
               <button type="button" class="btn btn-link"
                  @click="increment( item.article )"
                  ><i class="fa fa-plus-square"></i></button>
               <button class="btn btn-link" type="button"
                  @click="decrement( item.article )"
                  ><i class="fa fa-minus-square"></i></button>
            </td>
         </tr>
      </tbody>
      <tfoot>
         <tr>
            <td></td>
            <td>Subtotal</td>
            <td class="text-right app-out-sum">{{ format( sum ) }}</td>
            <td colspan="2"></td>
         </tr>
      </tfoot>
   </table>
   <div class="clearfix app-order-button-area" :class="{ 'hidden': isEmpty }">
      <button class="btn btn-default btn-success pull-right"
              type="button"
              @click="placeOrder()">
         <i class="fa fa-paper-plane"></i> Order
      </button>
   </div>
</div>
</template>


<script>
/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
export default {
   data: () => ({
      article: { id: null },
      cart: []
   }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.article.resource}`, ({ data }) => {
         this.article = data || { id: null };
      } );
      this.features.article.onActions.forEach( action => {
         this.eventBus.subscribe( `takeActionRequest.${action}`, () => {
            this.eventBus.publish( `willTakeAction.${action}`, { action } );
            if( this.article.id ) {
               this.increment( this.article );
            }
            this.eventBus.publish( `didTakeAction.${action}`, { action } );
         } );
      } );
   },
   computed: {
      isEmpty() {
         return !this.cart.length;
      },
      sum() {
         return this.cart.reduce( (sum, { article, quantity }) => sum + (quantity * article.price), 0 );
      }
   },
   methods: {
      format: price => price == null ? null : `€ ${price.toFixed( 2 )}`,
      increment( article ) {
         const isInCart = this.cart.some( item => item.article.id === article.id );
         this.cart = isInCart ?
            this.cart.map( adjuster( article, 1 ) ) :
            [ ...this.cart, { article, quantity: 1 } ];
      },
      decrement( article ) {
         this.cart = this.cart
            .map( adjuster( article, -1 ) )
            .filter( ({ quantity }) => quantity > 0 );
      },
      placeOrder() {
         const { target } = this.features.order;
         this.eventBus.publish( `navigateRequest.${target}`, { target } );
      }
   }
};

function adjuster( articleToMatch, increment ) {
   return ({ article, quantity }) => ({
      article,
      quantity: article.id === articleToMatch.id ? quantity + increment : quantity
   });
}
</script>
