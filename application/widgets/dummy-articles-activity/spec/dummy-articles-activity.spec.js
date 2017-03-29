/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as axMocks from 'laxar-mocks';
import { articles } from '../articles';

describe( 'The dummy-articles-activity', () => {

   beforeEach( axMocks.setupForWidget() );
   beforeEach( () => {
      axMocks.widget.configure( {
         articles: {
            resource: 'articles'
         }
      } );
   } );
   beforeEach( axMocks.widget.load );

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'on beginLifecycleRequest', () => {

      beforeEach( () => {
         axMocks.triggerStartupEvents();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'publishes some dummy articles', () => {
         expect( axMocks.widget.axEventBus.publish )
            .toHaveBeenCalledWith( 'didReplace.articles', {
               resource: 'articles',
               data: {
                  entries: articles.map( article => {
                     article.pictureUrl = article.picture ?
                        jasmine.any( String ) : null;
                     return article;
                  } )
               }
            } );
      } );

   } );

} );
