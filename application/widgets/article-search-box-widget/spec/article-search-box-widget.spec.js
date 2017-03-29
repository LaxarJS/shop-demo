/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/* global define */
define( [
   'laxar-mocks',
   'laxar',
   './spec_data.json'
], ( axMocks, ax, resourceData ) => {
   'use strict';

   describe( 'A ArticleSearchBoxWidget', () => {

      let data;
      let widgetEventBus;
      let widgetScope;
      let testEventBus;

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
         data = ax.object.deepClone( resourceData );
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when articles were published without given search term', () => {

         beforeEach( () => {
            testEventBus.publish( 'didReplace.articles', {
               resource: 'articles',
               data
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the same list as filtered articles', () => {
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.filteredArticles', {
               resource: 'filteredArticles',
               data
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and a search was initiated afterwards', () => {

            beforeEach( () => {
               widgetScope.model.searchTerm = 'beer';
               widgetScope.updateSearch();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes the updated search term as a place parameter', () => {
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'navigateRequest._self', {
                  target: '_self',
                  data: {
                     query: 'beer'
                  }
               } );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when articles were published with already given search term', () => {

         beforeEach( () => {
            widgetScope.model.searchTerm = 'beer';
            testEventBus.publish( 'didReplace.articles', {
               resource: 'articles',
               data
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the matching articles only', () => {
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.filteredArticles', {
               resource: 'filteredArticles',
               data: {
                  entries: [ data.entries[ 1 ] ]
               }
            } );
         } );

      } );

   } );

} );
