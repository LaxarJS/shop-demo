<template>
<div>
   <h3 class="ax-function-point"
      :class="{ 'app-articles': articles.length }">
      <i class="fa fa-gift"></i> Articles
   </h3>
   <table class="table table-hover table-striped"
      :class="{ 'app-articles': articles.length }">
      <colgroup>
         <col class="app-col-1">
         <col class="app-col-2">
         <col class="app-col-3">
      </colgroup>
      <thead>
         <tr v-if="!articles.length">
            <th class="app-no-articles" colspan="3">No articles</th>
         </tr>
         <tr v-if="articles.length">
            <th>Art. ID</th>
            <th>Article</th>
            <th class="price">Price</th>
         </tr>
      </thead>
      <tbody>
         <tr class="selectable"
            v-for="article in articles"
            @click="selectArticle( article )"
            :class="{ selected: article.id === selectedArticle.id }">
            <td class="app-col-1">{{ article.id }}</td>
            <td>{{ article.name }}</td>
            <td class="price">{{ article.price }}</td>
         </tr>
         <tr class="app-no-articles"
             v-if="!articles.length">
            <td colspan="5">&nbsp;</td>
         </tr>
      </tbody>
   </table>
</div>
</template>

<script>
/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
export default {
   data: () => ({
      selectedArticle: { id: null },
      articles: []
   }),
   created() {
      this.eventBus.subscribe( `didReplace.${this.features.articles.resource}`, event => {
         this.articles = event.data;
         this.selectArticle( null );
      } );
   },
   methods: {
      selectArticle( article ) {
         this.selectedArticle = article || { id: null };
         const { resource } = this.features.selection;
         this.eventBus.publish( `didReplace.${resource}`, { resource, data: article } );
      }
   }
};
</script>
