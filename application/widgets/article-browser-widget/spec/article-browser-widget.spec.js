/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/* global define */
define( [
   'laxar-mocks',
   'angular',
   'angular-mocks',
   'laxar',
   './spec_data.json'
], ( axMocks, ng, ngMocks, ax, resourceData ) => {
   'use strict';

   describe( 'The article-browser-widget', () => {

      let $httpBackend;
      let $rootScope;
      let data;
      let widgetEventBus;
      let testEventBus;

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
         ng.mock.module( $provide => {
            $provide.factory( '$timeout', () => {
               return { hans: true };
            } );
         } );
         axMocks.widget.whenServicesAvailable( () => {
            ng.mock.inject( _$httpBackend_ => {
               $httpBackend = _$httpBackend_;
               $httpBackend.whenGET( '/test' ).respond( { ok: true } );
            } );
         } );
      } );

      beforeEach( axMocks.widget.load );
      beforeEach( () => {
         data = ax.object.deepClone( resourceData );

         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
         $httpBackend.flush();
      } );
      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didReplace events of the articles resource', () => {
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.articles', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the list of articles is replaced', () => {

         beforeEach( () => {
            testEventBus.publish( 'didReplace.articles', {
               resource: 'articles',
               data
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resets the article selection', () => {
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.selectedArticle', {
               resource: 'selectedArticle',
               data: null
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the user selects an article', () => {

            beforeEach( () => {
               axMocks.widget.$scope.selectArticle( axMocks.widget.$scope.resources.articles[ 1 ] );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the configured selection resource is replaced', () => {
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                  resource: 'selectedArticle',
                  data: axMocks.widget.$scope.resources.articles[ 1 ]
               } );
            } );

         } );

      } );

   } );

} );
