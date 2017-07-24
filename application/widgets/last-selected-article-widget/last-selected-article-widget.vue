<template>
   <div>
      <p>Last selected article: {{ selectedArticle }}</p>
      <p>Value of place parameter 'articleName'): {{ articlePlaceParameter }}</p>
      <a :href="href">Try this to lose the search term!</a>
   </div>
</template>

<script>
/**
 * Copyright 2017
 * Released under the MIT license
 */
import { injections } from 'laxar-vue-adapter';
export default {
   mixins: [ injections( 'axFlowService' ) ],
   data: () => ( {
      articlePlaceParameter: '',
      selectedArticle: 'no selected Article',
      href: ''
   } ),
   created() {
      const { article, display } = this.features;
      this.eventBus.subscribe( 'didNavigate', event => {
         if( event.data[ display.parameterName ] ) {
            this.articlePlaceParameter = event.data[ display.parameterName ];
            this.selectedArticle = event.data[ display.parameterName ];
            this.createLink();
         }
         else {
            this.articlePlaceParameter = `no place parameter ${this.features.display.parameterName}`;
         }
      } );
      this.eventBus.subscribe( `didReplace.${this.features.article.resource}`, event => {
         if( typeof event.data === 'object' && event.data !== null ) {
            if( event.data.id ) {
               this.selectedArticle = event.data.name;
               this.articlePlaceParameter = event.data.name;
               this.createLink();
            }
         }
      } );
   },
   methods: {
      createLink() {
         const [ flowService ] = this.$injections;
         const placeParameters = {};
         placeParameters[ this.features.display.parameterName ] = this.articlePlaceParameter;
         // If the place parameter 'search' was set by the article-search-box-widget before it will be lost here
         this.href = flowService.constructAbsoluteUrl( '_self', placeParameters );
      }
   }
};
</script>
