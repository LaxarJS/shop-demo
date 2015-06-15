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

      $scope.resources = {};
      $scope.selectedArticle = null;

      var articlesResource = $scope.features.articles.resource;
      eventBus.subscribe( 'didReplace.' + articlesResource, function( event ) {
         $scope.resources.articles = event.data;
         $scope.selectArticle( null );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.selectArticle = function( article ) {
         $scope.selectedArticle = article;

         var selectionResource = $scope.features.selection.resource;
         eventBus.publish( 'didReplace.' + selectionResource, {
            resource: selectionResource,
            data: article
         } );
      };

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'articleBrowserWidget', [] )
      .controller( 'ArticleBrowserWidgetController', Controller );

} );
