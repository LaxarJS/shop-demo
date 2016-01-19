/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   '../ax-developer-tools-widget',
   'angular-mocks',
   'jquery',
   'laxar',
   'laxar-mocks'
], function( descriptor, widgetModule, ngMocks, $, ax, axMocks ) {
   'use strict';

   describe( 'The ax-developer-tools-widget', function() {

      var testBed;
      var windowOpenSpy;
      var windowState;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         windowState.closed = true;

         if( window.axDeveloperTools ) {
            delete window.axDeveloperTools.buffers.log;
            delete window.axDeveloperTools.buffers.events;
            delete window.axDeveloperTools.buffers;
         }
         delete window.axDeveloperTools;
      } );

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature "open"', function() {

         beforeEach( axMocks.createSetupForWidget( descriptor ) );

         beforeEach( function() {
            axMocks.widget.configure( {
               open: {
                  onActions: [ 'develop' ],
                  onGlobalMethod: 'axOpenDevTools'
               }
            } );

            windowState = {
               closed: false,
               focus: jasmine.createSpy( 'focus' )
            };

            windowOpenSpy = spyOn( window, 'open' ).and.callFake( function() {
               return windowState;
            } );
         } );

         beforeEach( axMocks.widget.load );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to configure an action for opening the developer tools window (R1.1)', function() {
            expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
               'takeActionRequest.develop', jasmine.any( Function ) );
            axMocks.eventBus.publish( 'takeActionRequest.develop', { action: 'develop' } );
            axMocks.eventBus.flush();
            expect( windowOpenSpy ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to configure a global javascript method that opens the window directly (R1.2)', function() {
            window.axOpenDevTools();
            expect( windowOpenSpy ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'establishes a _communication channel_ to the contents of the developer tools window when open (R1.3)', function() {
            window.axOpenDevTools();
            expect( window.axDeveloperTools ).toBeDefined();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'intercepts _event bus activity_ from the host application and forwards it to the communication channel as JSON (R1.4)', function() {
            window.axOpenDevTools();
            axMocks.eventBus.flush();

            axMocks.eventBus.subscribe( 'someEvent', function() {} );
            axMocks.eventBus.publish( 'someEvent', { content: 'develop' } );
            axMocks.eventBus.flush();

            // initial subscribe for develop action + subscribe/publish/deliver for someEvent:
            expect( window.axDeveloperTools.buffers.events.length ).toBe( 4 );

            var index = window.axDeveloperTools.buffers.events[ 0 ].index;
            expect( index ).toEqual( jasmine.any( Number ) );

            var payload = window.axDeveloperTools.buffers.events[ 0 ].json;
            expect( payload ).toEqual( jasmine.any( String ) );
            expect( JSON.parse( payload ) ).toEqual( {
               action: 'subscribe',
               source: 'widget.ax-developer-tools-widget#testWidget',
               target: '-',
               event: 'takeActionRequest.develop',
               cycleId: -1,
               time: jasmine.any( Number )
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'intercepts LaxarJS _log messages_ from the host application and forwards them to the communication channel as JSON (R1.5)', function() {
            window.axOpenDevTools();
            ax.log.info( 'test log message A' );
            ax.log.info( 'test log message B' );
            expect( window.axDeveloperTools.buffers.log.length ).toBe( 2 );

            var index = window.axDeveloperTools.buffers.log[ 0 ].index;
            expect( index ).toEqual( jasmine.any( Number ) );

            var payload = window.axDeveloperTools.buffers.log[ 0 ].json;
            expect( payload ).toEqual( jasmine.any( String ) );
            expect( JSON.parse( payload ) ).toEqual( {
               id: jasmine.any( Number ),
               level: 'INFO',
               text: 'test log message A',
               replacements: [],
               time: jasmine.any( String ),
               tags: {},
               sourceInfo: jasmine.any( Object )
            } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Note that he requirements R2 - R4 are satisfied by the content application widgets!

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'disabled by application-wide configuration', function() {

         var configPath = 'widgets.laxar-developer-tools-widget.enabled';

         beforeEach( function() {
            spyOn( ax.configuration, 'get' ).and.callFake( function( key, fallback ) {
               if( key === configPath ) {
                  expect( fallback ).toEqual( true );
                  return false;
               }
               return fallback;
            } );
            spyOn( ax.log, 'addLogChannel' );
         } );

         beforeEach( axMocks.createSetupForWidget( descriptor, {
            knownMissingResources: [ 'ax-i18n-control.css' ]
         } ) );

         beforeEach( axMocks.widget.load );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not subscribe to action requests (R6.1)', function() {
            expect( axMocks.widget.axEventBus.subscribe ).not.toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not intercept events (R6.2)', function() {
            expect( window.axDeveloperTools ).not.toBeDefined();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not intercept log messages (R6.3)', function() {
            expect( ax.log.addLogChannel ).not.toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not add a configured global method (R6.4)', function() {
            expect( window.axOpenDevTools ).not.toBeDefined();
            expect( window.laxarShowDeveloperTools ).not.toBeDefined();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not add a button (R6.5)', function() {
            expect( axMocks.widget.$scope.enabled ).toBeFalsy();
         } );

      } );

   } );

} );
