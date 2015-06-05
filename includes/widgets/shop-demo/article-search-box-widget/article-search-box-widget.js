/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( [
   'angular',
   'pouchdb',
   'laxar',
   './articles_data'
], function( ng, PouchDb, ax, articlesData ) {
   'use strict';

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      $scope.model = {
         searchTerm: ''
      };

      var db = new PouchDb( $scope.features.database.pouchDb.dbId );

      var articlesPromise = search();
      $scope.eventBus.subscribe( 'beginLifecycleRequest', function() {
         articlesPromise.then( publishArticles, handleError );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.search = function() {
         search().then( publishArticles, handleError );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleError( error ) {
         ax.log.debug( error );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function search() {
         return fetchArticles()
            .then( function( articles ) {
               return filterArticles( articles, $scope.model.searchTerm );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function fetchArticles() {

         return db.query( map )
            .then( function( response ) {
               if( response.rows.length === 0 ) {
                  // For demoing purposes we insert some items into the database here if it is empty.
                  return db.bulkDocs( articlesData )
                     .then( function() {
                        return db.query( map );
                     } )
                     .then( function( response ) {
                        return response.rows;
                     } );
               }
               return response.rows;
            } )
            .then( function( rows ) {
               return rows.map( function( entry ) {
                  return { id: entry.id, details: entry.value };
               } );
            } );

         function map( doc ) {
            if( doc.details ) {
               /* global emit */
               emit( doc.id, doc.details );
            }
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function filterArticles( articles, searchTerm ) {
         if( searchTerm.length < 2 ) {
            return articles;
         }

         var lcSearchTerm = searchTerm.toLowerCase();
         return articles.filter( function( article ) {
            var title = article.details.name.toLowerCase();
            var description = article.details.htmlDescription.toLowerCase();
            return title.indexOf( lcSearchTerm ) !== -1 || description.indexOf( lcSearchTerm ) !== -1;
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishArticles( articles ) {
         if( articles ) {
            var resourceName = $scope.features.resource;
            $scope.eventBus.publish( 'didReplace.' + resourceName, {
               resource: resourceName,
               data: { entries: articles }
            } );
         }
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'articleSearchBoxWidget', [] )
      .controller( 'ArticleSearchBoxWidgetController', Controller );

} );
