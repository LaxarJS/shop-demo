/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-testing',
   'laxar',
   'json!./spec_data.json'
], function( descriptor, testing, ax, resourceData ) {
   'use strict';

   describe( 'The ArticleBrowserWidget', function() {

      var data;
      var widgetEventBus;
      var widgetScope;
      var testEventBus;

      beforeEach( testing.createSetupForWidget( descriptor ) );
      beforeEach( function() {
         testing.widget.configure( {
            articles: {
               resource: 'articles'
            },
            selection: {
               resource: 'selectedArticle'
            }
         } );
      } );
      beforeEach( testing.widget.load );
      beforeEach( function() {
         data = ax.object.deepClone( resourceData );
         widgetScope = testing.widget.$scope;
         widgetEventBus = testing.widget.axEventBus;
         testEventBus = testing.eventBus;
      } );
      afterEach( testing.tearDown );

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
               testing.widget.$scope.selectArticle( testing.widget.$scope.resources.articles[ 1 ] );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the configured selection resource is replaced', function() {
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.selectedArticle', {
                  resource: 'selectedArticle',
                  data: testing.widget.$scope.resources.articles[ 1 ]
               } );
            } );

         } );

      } );

   } );

} );
