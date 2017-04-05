<template>
   <form role="form" @submit="updateSearch()">
      <div class="form-group">
         <div class="input-group">
            <input class="form-control"
               type="text"
               placeholder="Search for articles"
               v-model="searchTerm">
            <span class="input-group-btn">
               <button class="btn btn-default" type="submit"><i class="fa fa-search"></i></button>
            </span>
         </div>
      </div>
   </form>
</template>


<script>
/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
const searchFields = [ 'some', 'id', 'htmlDescription' ];

export default {
   data: () => ({
      searchTerm: '',
      articles: [],
      filteredArticles: []
   }),
   created() {
      const articlesResource = this.features.articles.resource;

      this.eventBus.subscribe( `didReplace.${articlesResource}`, event => {
         this.articles = event.data || [];
         this.search();
      } );

      this.eventBus.subscribe( 'didNavigate', event => {
         this.searchTerm = event.data[ this.features.navigation.parameterName ] || '';
         this.search();
      } );
   },
   computed: {
      isSelected() {
         return this.article.id !== null;
      }
   },
   methods: {
      updateSearch() {
         const target = '_self';
         const data = {
            [ this.features.navigation.parameterName ]: this.searchTerm || null
         };
         this.eventBus.publish( `navigateRequest.${target}`, { target, data } );
      },
      search() {
         const search = this.searchTerm.toLowerCase();
         const matches = subject => ( subject || '' ).toLowerCase().indexOf( search ) !== -1;
         const articles = search ?
            this.articles.filter( article => searchFields.some( field => matches( article[ field ] ) ) ) :
            this.articles;

         const hasChanged =
            this.filteredArticles.length !== articles.length ||
            this.filteredArticles.some( (article, i) => article.id !== articles[ i ].id );

         if( hasChanged ) {
            this.filteredArticles = articles;
            const { resource } = this.features.filteredArticles;
            this.eventBus.publish( `didReplace.${resource}`, {
               resource,
               data: articles
            } );
         }
      }
   }
};
</script>
