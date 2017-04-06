/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';
import { object } from 'laxar';
import * as resourceData from './spec_data.json';

describe( 'A ArticleSearchBoxWidget', () => {

   let data;
   let vueComponent;

   beforeEach( axMocks.setupForWidget() );
   beforeEach( () => {
      axMocks.widget.configure( {
         navigation: {
            parameterName: 'query'
         },
         articles: {
            resource: 'articles'
         },
         filteredArticles: {
            resource: 'filteredArticles'
         }
      } );
   } );
   beforeEach( axMocks.widget.load );
   beforeEach( () => {
      data = object.deepClone( resourceData );
      ({ vueComponent } = axMocks.widget);
   } );
   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when articles are published without given search term', () => {

      beforeEach( () => {
         axMocks.eventBus.publish( 'didReplace.articles', {
            resource: 'articles',
            data
         } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'publishes the same list as filtered articles', () => {
         expect( vueComponent.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.filteredArticles', {
            resource: 'filteredArticles',
            data
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and a search is initiated afterwards', () => {

         beforeEach( () => {
            vueComponent.searchTerm = 'beer';
            vueComponent.search();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the updated search term as a place parameter', () => {
            expect( vueComponent.eventBus.publish ).toHaveBeenCalledWith( 'navigateRequest._self', {
               target: '_self',
               data: {
                  query: 'beer'
               }
            } );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when articles are published with already given search term', () => {

      beforeEach( () => {
         vueComponent.searchTerm = 'beer';
         axMocks.eventBus.publish( 'didReplace.articles', {
            resource: 'articles',
            data
         } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'publishes the matching articles only', () => {
         expect( vueComponent.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.filteredArticles', {
            resource: 'filteredArticles',
            data: data.slice( 1, 2 )
         } );
      } );

   } );

} );
