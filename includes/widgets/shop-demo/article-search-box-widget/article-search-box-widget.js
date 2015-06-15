/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'angular'
], function( ng ) {
   'use strict';

   Controller.$inject = [ '$scope', 'axEventBus' ];

   function Controller( $scope, eventBus ) {

      $scope.model = {
         searchTerm: ''
      };
      $scope.search = search;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      var unfilteredArticles = [];
      var filteredArticles = [];
      var articlesResource = $scope.features.articles.resource;
      var filterArticlesResource = $scope.features.filteredArticles.resource;

      eventBus.subscribe( 'didReplace.' + articlesResource, function( event ) {
         unfilteredArticles = event.data.entries || [];
         search();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function search() {
         var newFilteredArticles = unfilteredArticles;
         var searchTerm = $scope.model.searchTerm;
         if( searchTerm ) {
            newFilteredArticles = unfilteredArticles.filter( function( article ) {
               return infixMatch( article.name, searchTerm ) ||
                  infixMatch( article.id, searchTerm ) ||
                  infixMatch( article.htmlDescription, searchTerm );
            } );
         }

         if( !ng.equals( newFilteredArticles, filteredArticles ) ) {
            filteredArticles = newFilteredArticles;
            eventBus.publish( 'didReplace.' + filterArticlesResource, {
               resource: filterArticlesResource,
               data: {
                  entries: filteredArticles
               }
            } );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function infixMatch( subject, query ) {
         return ( subject || '' ).toLowerCase().indexOf( query.toLowerCase() ) !== -1;
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'articleSearchBoxWidget', [] )
      .controller( 'ArticleSearchBoxWidgetController', Controller );

} );
