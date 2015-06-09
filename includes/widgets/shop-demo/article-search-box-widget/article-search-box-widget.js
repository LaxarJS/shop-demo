/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'angular',
   'laxar'
], function( ng, ax ) {
   'use strict';

   Controller.$inject = [ '$scope', 'axEventBus' ];

   function Controller( $scope, eventBus ) {

      $scope.model = {
         searchTerm: ''
      };
      $scope.search = refreshAndPublishFilteredArticles;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      var unfilteredArticles = [];
      var filteredArticles = [];
      var articlesResource = $scope.features.articles.resource;
      var filterArticlesResource = $scope.features.filteredArticles.resource;

      eventBus.subscribe( 'didReplace.' + articlesResource, function( event ) {
         unfilteredArticles = ax.object.path( event, 'data.entries', [] );

         refreshAndPublishFilteredArticles();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function refreshAndPublishFilteredArticles() {
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
            $scope.eventBus.publish( 'didReplace.' + filterArticlesResource, {
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
