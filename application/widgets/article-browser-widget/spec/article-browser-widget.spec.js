/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';
import { object } from 'laxar';
import * as resourceData from './spec_data.json';

describe( 'The article-browser-widget', () => {

   let vueComponent;
   let data;

   beforeEach( axMocks.setupForWidget() );

   beforeEach( () => {
      axMocks.widget.configure( {
         articles: {
            resource: 'articles'
         },
         selection: {
            resource: 'selectedArticle'
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

   it( 'subscribes to didReplace events of the articles resource', () => {
      expect( vueComponent.eventBus.subscribe )
         .toHaveBeenCalledWith( 'didReplace.articles', jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the list of articles is replaced', () => {

      beforeEach( () => {
         axMocks.eventBus.publish( 'didReplace.articles', {
            resource: 'articles',
            data
         } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'resets the article selection', () => {
         expect( vueComponent.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.selectedArticle', {
            resource: 'selectedArticle',
            data: null
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and the user selects an article', () => {

         beforeEach( () => {
            vueComponent.selectArticle( vueComponent.articles[ 1 ] );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the configured selection resource is replaced', () => {
            expect( vueComponent.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.selectedArticle', {
               resource: 'selectedArticle',
               data: vueComponent.articles[ 1 ]
            } );
         } );

      } );

   } );

} );
