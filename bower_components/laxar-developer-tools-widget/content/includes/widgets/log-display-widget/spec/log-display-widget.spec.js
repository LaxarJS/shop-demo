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

   describe( 'The log-display-widget', function() {

      var testBed;
      var messageItems;
      var bufferSize = 3;

      beforeEach( axMocks.createSetupForWidget( descriptor ) );

      beforeEach( function() {
         messageItems = [
            {
               level: 'INFO',
               text: 'test info message',
               time: '2015-01-01T01:01:01.001Z',
               sourceInfo: {
                  file: 'some/file.js',
                  line: 101
               }
            },
            {
               level: 'WARN',
               text: 'test WARN message',
               time: '2015-01-01T01:01:02.001Z',
               sourceInfo: {
                  file: 'some/other/file.js',
                  line: 101
               }
            }
         ];

         axMocks.widget.configure( {
            log: {
               stream: 'myLogStream',
               bufferSize: bufferSize
            }
         } );

      } );

      beforeEach( axMocks.widget.load );

      beforeEach( function() {
         axMocks.eventBus.publish( 'didProduce.myLogStream', { data: messageItems } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'to display log messages (log)', function() {

         it( 'subscribes to the configured meta-event, to obtain event items (R1.1)', function() {
            expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
               'didProduce.myLogStream',
               jasmine.any( Function )
            );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'represents each log item (R1.2)', function() {
            expect( axMocks.widget.$scope.model.messages.length ).toEqual( 2 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'maintains a buffer of limited size (R1.3)', function() {
            axMocks.eventBus.publish( 'didProduce.myLogStream', { data: messageItems } );
            axMocks.eventBus.flush();
            expect( axMocks.widget.$scope.model.messages.length ).toEqual( bufferSize );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'offers the user to clear the buffer manually, removing all event rows from view (R1.4)', function() {
            axMocks.widget.$scope.commands.discard();
            expect( axMocks.widget.$scope.model.messages.length ).toEqual( 0 );
         } );

      } );

   } );

} );
