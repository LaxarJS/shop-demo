/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'require',
   'angular',
   './articles'
], function( require, ng, articles ) {
   'use strict';

   Controller.$inject = [ 'axContext', 'axEventBus' ];

   function Controller( context, eventBus ) {
      eventBus.subscribe( 'beginLifecycleRequest', function() {
         var articleResource = context.features.articles.resource;
         eventBus.publish( 'didReplace.' + articleResource, {
            resource: articleResource,
            data: {
               entries: articles.map( function( article ) {
                  var copy = ng.copy( article );
                  copy.pictureUrl = article.picture ? require.toUrl( './images/' + article.picture ) : null;
                  return copy;
               } )
            }
         } );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'dummyArticlesActivity', [] )
      .controller( 'DummyArticlesActivityController', Controller );

} );
