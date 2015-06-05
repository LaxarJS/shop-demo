/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns',
   'angular-sanitize'
], function( ng, ax, patterns ) {
   'use strict';

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      $scope.resources = {};
      $scope.selectedArticle = null;

      patterns.resources.handlerFor( $scope )
         .registerResourceFromFeature( 'display', { onUpdateReplace: checkArticles } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.selectArticle = function( article ) {
         $scope.selectedArticle = article;
         var resourceName = $scope.features.select.resource;
         $scope.eventBus.publish( 'didReplace.' + resourceName, {
               resource: resourceName,
               data: article
            }, {
               deliverToSender: false
            }
         );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function checkArticles() {
         var resources = $scope.resources;
         var selectedArticle = $scope.selectedArticle;
         if( selectedArticle === null ) {
            return;
         }

         var entries = ax.object.path( resources, 'display.entries', [] );
         if( !entries.length ) {
            $scope.selectArticle( null );
            return;
         }

         var selectedArticleExists = entries.some( function( article ) {
            return article.id === selectedArticle.id;
         } );

         if( !selectedArticleExists ) {
            $scope.selectArticle( null );
         }
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'articleBrowserWidget', [ 'ngSanitize' ] )
      .controller( 'ArticleBrowserWidgetController', Controller );

} );
