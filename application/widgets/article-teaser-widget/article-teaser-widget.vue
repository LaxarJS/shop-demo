<template>
<div>
   <h3 :class="`ax-function-point ${isSelected ? 'app-selection' : ''}`">
      <i class='fa fa-search'></i> Details
   </h3>
   <div class="app-teaser-wrapper clearfix"
      :class="{ 'app-selection' : article.id }">
      <h4 :class="{ 'app-no-selection' : !article.id }">{{ article.name || 'No article selected' }}</h4>
      <div class="row">
         <div class="col col-md-12 app-teaser-image-wrapper">
            <img v-if="article.pictureUrl" class='app-teaser-image' :src="article.pictureUrl" />
         </div>
      </div>
      <div class="row">
         <div class="col col-md-12">
            <dl class="dl-horizontal">
               <dt :class="{ 'ax-disabled': article.id }">Art. ID</dt>
               <dd>{{ article.id }}</dd>

               <dt :class="{ 'ax-disabled': article.id }">Description</dt>
               <dd v-html="article.htmlDescription"></dd>

               <dt :class="{ 'ax-disabled': article.id }">Price</dt>
               <dd>{{ formatted( article.price ) }}</dd>
            </dl>
         </div>
      </div>
   </div>
   <div class="clearfix">
      <button type="button"
          class="btn pull-right"
          :class="{ 'btn-info': article.id, 'ax-disabled': !article.id }"
          @click="addToCart()"><i class="fa fa-shopping-cart"></i> Add to Cart</button>
   </div>
</div>
</template>


<script>
/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
export default {
   data: () => ({ article: { id: null } }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.article.resource}`, ({ data }) => {
         this.article = data || { id: null };
      } );
   },
   computed: {
      isSelected() {
         return this.article.id !== null;
      }
   },
   methods: {
      formatted: price => price == null ? null : `€ ${price.toFixed( 2 )}`,
      addToCart() {
         const { action } = this.features.confirmation;
         this.eventBus.publish( `takeActionRequest.${action}`, { action } );
      }
   }
}
</script>
