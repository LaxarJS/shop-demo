/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'laxar',
   'json!./spec_data.json'
], function( descriptor, axMocks, ax, resourceData ) {
   'use strict';

   describe( 'The article-browser-widget', function() {

      var data;
      var widgetEventBus;
      var widgetScope;
      var testEventBus;

      beforeEach( axMocks.createSetupForWidget( descriptor ) );
      beforeEach( function() {
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
      beforeEach( function() {
         data = ax.object.deepClone( resourceData );
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didReplace events of the articles resource', function() {
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.articles', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the list of articles is replaced', function() {

         beforeEach( function() {
            testEventBus.publish( 'didReplace.articles', {
               resource: 'articles',
               data: data
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resets the article selection', function() {
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.selectedArticle', {
               resource: 'selectedArticle',
               data: null
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the user selects an article', function() {

            beforeEach( function() {
               axMocks.widget.$scope.selectArticle( axMocks.widget.$scope.resources.articles[ 1 ] );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the configured selection resource is replaced', function() {
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                  resource: 'selectedArticle',
                  data: axMocks.widget.$scope.resources.articles[ 1 ]
               } );
            } );

         } );

      } );

   } );

} );
