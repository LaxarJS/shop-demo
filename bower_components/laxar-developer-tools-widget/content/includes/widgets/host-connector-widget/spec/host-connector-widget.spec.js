/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks'
], function( descriptor, axMocks ) {
   'use strict';

   describe( 'A host-connector-widget', function() {

      var testBed;
      var fakeChannel;


      beforeEach( axMocks.createSetupForWidget( descriptor ) );

      beforeEach( function() {
         // fake the AxDeveloperToolsWidget presence in the opener window:
         window.opener = {
            axDeveloperTools: {
               buffers: {
                  events: [],
                  log: []
               }
            }
         };

         fakeChannel = window.opener.axDeveloperTools;

         axMocks.widget.configure( {
            events: {
               stream: 'eventBusItems'
            },
            log: {
               stream: 'logItems'
            },
            grid: {
               resource: 'gridSettings'
            },
            pageInfo: {
               resource: 'page'
            },
            laxarApplication: {
               flag: 'isLaxarApplication'
            }
         } );
      } );

      beforeEach( axMocks.widget.load );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'polls the host application for event bus interactions and publishes them through the configured stream topic (R1.1)',
         function( done ) {
            axMocks.eventBus.publish( 'beginLifecycleRequest' );
            axMocks.eventBus.flush();
                           expect( axMocks.widget.axEventBus.publish ).not.toHaveBeenCalledWith( 'didProduce.logItems', jasmine.any(Object) );
            fakeChannel.buffers.events.push( { index: 0, json: JSON.stringify( { fake: 'event item' } ) } );
            window.setTimeout( function() {
                              expect( axMocks.widget.axEventBus.publish ).not.toHaveBeenCalledWith( 'didProduce.logItems', jasmine.any(Object) );
               window.setTimeout( function() {
                  expect( axMocks.widget.axEventBus.publish ).toHaveBeenCalledWith( 'didProduce.eventBusItems', {
                     stream: 'eventBusItems',
                     data: [ { fake: 'event item' } ]
                  } );
                  done();
               }, 21 );
            }, 80 );
         }
      );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'polls the host application for log messages and publishes them through the configured stream topic (R1.2)',
         function( done ) {
            axMocks.eventBus.publish( 'beginLifecycleRequest' );
            axMocks.eventBus.flush();

                        expect( axMocks.widget.axEventBus.publish ).not.toHaveBeenCalledWith( 'didProduce.logItems', jasmine.any(Object) );
            fakeChannel.buffers.log.push( { index: 0, json: JSON.stringify( { fake: 'log item' } ) } );
            window.setTimeout( function() {
               expect( axMocks.widget.axEventBus.publish ).not.toHaveBeenCalledWith( 'didProduce.logItems', jasmine.any(Object) );
               window.setTimeout( function() {
                  expect( axMocks.widget.axEventBus.publish ).toHaveBeenCalledWith( 'didProduce.logItems', {
                     stream: 'logItems',
                     data: [ { fake: 'log item' } ]
                  } );
                  done();
               }, 21 );
            }, 80 );
         }
      );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'polls the host application for CSS grid settings and publishes them through the configured resource (R1.3)', function() {
         fakeChannel.gridSettings = { fake: 'grid' };
         axMocks.eventBus.publish( 'beginLifecycleRequest' );
         axMocks.eventBus.flush();
         expect( axMocks.widget.axEventBus.publish ).toHaveBeenCalledWith( 'didReplace.gridSettings', {
            resource: 'gridSettings',
            data: { fake: 'grid' }
         } );
      } );

   } );

} );
