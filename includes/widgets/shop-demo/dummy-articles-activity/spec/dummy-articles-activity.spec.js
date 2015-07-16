/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-testing',
   '../articles'
], function( descriptor, testing, articles ) {
   'use strict';

   describe( 'The DummyArticlesActivity', function() {

      beforeEach( testing.createSetupForWidget( descriptor ) );
      beforeEach( function() {
         testing.widget.configure( {
            articles: {
               resource: 'articles'
            }
         } );
      } );
      beforeEach( testing.widget.load );

      afterEach( testing.tearDown );

      /////////////////////////////////////////////////////////////////////////

      describe( 'on beginLifecycleRequest', function() {

         beforeEach( function() {
            testing.triggerStartupEvents();
         } );

         //////////////////////////////////////////////////////////////////////

         it( 'publishes some dummy articles', function() {
            expect( testing.widget.axEventBus.publish )
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
