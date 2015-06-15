/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 */
define( [
   'angular',
   './articles'
], function( ng, articles ) {
   'use strict';

   Controller.$inject = [ 'axContext', 'axEventBus' ];

   function Controller( context, eventBus ) {
      eventBus.subscribe( 'beginLifecycleRequest', function() {
         var articleResource = context.features.articles.resource;
         eventBus.publish( 'didReplace.' + articleResource, {
            resource: articleResource,
            data: {
               entries: articles
            }
         } );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'dummyArticlesActivity', [] )
      .controller( 'DummyArticlesActivityController', Controller );

} );
