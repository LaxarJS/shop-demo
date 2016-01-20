/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   '../articles'
], function( descriptor, axMocks, articles ) {
   'use strict';

   describe( 'The dummy-articles-activity', function() {

      beforeEach( axMocks.createSetupForWidget( descriptor ) );
      beforeEach( function() {
         axMocks.widget.configure( {
            articles: {
               resource: 'articles'
            }
         } );
      } );
      beforeEach( axMocks.widget.load );

      afterEach( axMocks.tearDown );

      /////////////////////////////////////////////////////////////////////////

      describe( 'on beginLifecycleRequest', function() {

         beforeEach( function() {
            axMocks.triggerStartupEvents();
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'publishes some dummy articles', function() {
            expect( axMocks.widget.axEventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.articles', {
                  resource: 'articles',
                  data: {
                     entries: articles.map( function( article ) {
                        article.pictureUrl = article.picture ?
                           jasmine.any( String ) : null;
                        return article;
                     } )
                  }
               } );
         } );

      } );

   } );
} );
