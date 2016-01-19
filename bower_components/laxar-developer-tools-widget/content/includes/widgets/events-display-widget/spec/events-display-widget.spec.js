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

   describe( 'An events-display-widget', function() {

      var testBed;
      var metaEvents;
      var bufferSize = 9;

      beforeEach( axMocks.createSetupForWidget( descriptor ) );

      beforeEach( function() {
         metaEvents = [
            {
               action: 'subscribe',
               event: 'takeActionRequest.doStuff',
               source: 'widget.myPopupWidget',
               cycleId: 1,
               time: '2015-01-01T00:00:02.001Z'
            },
            {
               action: 'subscribe',
               event: 'takeActionRequest.doStuff',
               source: 'widget.myOtherWidget',
               cycleId: 1,
               time: '2015-01-01T00:00:02.001Z'
            },
            {
               action: 'subscribe',
               event: 'didNavigate',
               source: 'widget.someWidget',
               cycleId: 2,
               time: '2015-01-01T00:00:02.001Z'
            },
            {
               action: 'publish',
               event: 'didNavigate.here',
               source: 'axFlowController',
               cycleId: 3,
               time: '2015-01-01T00:00:03.001Z',
               eventObject: { target: 'here', data: {} }
            },
            {
               action: 'publish',
               event: 'takeActionRequest.doStuff',
               source: 'widget.myButtonWidget',
               cycleId: 4,
               time: '2015-01-01T00:00:04.001Z',
               eventObject: { action: 'here' }
            },
            {
               action: 'deliver',
               event: 'didNavigate.here',
               source: 'axFlowController',
               target: 'widget.someWidget',
               cycleId: 3,
               time: '2015-01-01T00:00:03.002Z'
            },
            {
               action: 'deliver',
               event: 'takeActionRequest.doStuff',
               source: 'widget.myButtonWidget',
               target: 'widget.myPopupWidget',
               cycleId: 4,
               time: '2015-01-01T00:00:04.002Z'
            },
            {
               action: 'deliver',
               event: 'takeActionRequest.doStuff',
               source: 'widget.myButtonWidget',
               target: 'widget.myOtherWidget',
               cycleId: 4,
               time: '2015-01-01T00:00:04.003Z'
            },
            {
               action: 'unsubscribe',
               event: 'takeActionRequest.doStuff',
               source: 'widget.myPopupWidget',
               cycleId: 5,
               time: '2015-01-01T00:00:05.001Z'
            },
            {
               action: 'unsubscribe',
               event: 'takeActionRequest.doStuff',
               source: 'widget.myOtherWidget',
               cycleId: 5,
               time: '2015-01-01T00:00:05.001Z'
            }
         ];

         axMocks.widget.configure( {
            events: {
               stream: 'myEventStream',
               bufferSize: bufferSize
            }
         } );
      } );

      beforeEach( axMocks.widget.load );
      beforeEach( function() {
         axMocks.eventBus.publish( 'didProduce.myEventStream', { data: metaEvents } );
         axMocks.eventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'to display event items (events)', function() {

         it( 'subscribes to the configured meta-event, to obtain event items (R1.1)', function() {
            expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
               'didProduce.myEventStream',
               jasmine.any( Function )
            );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'represents each event item if not filtered out (R1.2)', function() {
            var expectedVisibleItems = axMocks.widget.$scope.model.eventInfos.filter( function( info ) {
               return info.interaction in { 'publish': 1, 'deliver': 1 } &&
                      -1 === info.source.indexOf( 'AxFlowController' );
            } );
            expect( axMocks.widget.$scope.model.visibleEventInfos ).toEqual( expectedVisibleItems );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'maintains a buffer of limited size (R1.3)', function() {
            expect( axMocks.widget.$scope.model.eventInfos.length ).toEqual( bufferSize );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'offers the user to clear the buffer manually, removing all event rows from view (R1.4)', function() {
            axMocks.widget.$scope.commands.discard();
            expect( axMocks.widget.$scope.model.eventInfos.length ).toEqual( 0 );
            expect( axMocks.widget.$scope.model.visibleEventInfos.length ).toEqual( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows for the user to select events rows, resulting in a highlighted representation (R1.5)', function() {
            expect( axMocks.widget.$scope.model.visibleEventInfos[ 0 ].selected ).toBe( false );
            axMocks.widget.$scope.commands.select( axMocks.widget.$scope.model.visibleEventInfos[ 0 ] );
            expect( axMocks.widget.$scope.model.visibleEventInfos[ 0 ].selected ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'When a row with interaction type _publish_ or _subscribe_ is highlighted', function() {

            beforeEach( function() {
               axMocks.widget.$scope.model.settings.sources.runtime = true;
               axMocks.widget.$scope.$digest();
               // select publish for takeActionRequest.doStuff
               axMocks.widget.$scope.commands.select( axMocks.widget.$scope.model.visibleEventInfos[ 1 ] );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'highlights _related_ rows as well (R1.6)', function() {
               var selected = axMocks.widget.$scope.model.visibleEventInfos.map( function( _ ) { return _.selected; } );
               // expect publish/deliver for takeActionRequest.doStuff
               expect( selected ).toEqual( [ true, true, false, true, false ] );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows for the user to impose a _limit_ on the number of most recent events to display (R1.7)', function() {
            axMocks.widget.$scope.model.settings.visibleEventsLimit = 2;
            axMocks.widget.$scope.$digest();

            expect( axMocks.widget.$scope.model.visibleEventInfos.length ).toEqual( 2 );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'to filter event items (filters)', function() {

         it( 'offers to filter events _by name_, using regular expressions (R2.1)', function() {
            axMocks.widget.$scope.model.settings.interactions.subscribe = true;

            // select didNavigate, but not didNavigate.here
            axMocks.widget.$scope.model.settings.namePattern = 'did[^.]+$';
            axMocks.widget.$scope.$digest();

            expect( axMocks.widget.$scope.model.visibleEventInfos.length ).toEqual( 1 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'offers to filter events _by pattern_, using a group of toggle controls (R2.2)', function() {
            axMocks.widget.$scope.model.settings.sources.runtime = true;
            axMocks.widget.$scope.model.settings.interactions.subscribe = true;
            axMocks.widget.$scope.model.settings.interactions.unsubscribe = true;

            axMocks.widget.$scope.model.settings.patterns.actions = false;
            axMocks.widget.$scope.$digest();

            expect( axMocks.widget.$scope.model.visibleEventInfos.length ).toEqual( 3 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'offers to filter events _by interaction type_, using a group of toggle controls (R2.3)', function() {
            axMocks.widget.$scope.model.settings.sources.runtime = true;

            axMocks.widget.$scope.model.settings.interactions.subscribe = true;
            axMocks.widget.$scope.model.settings.interactions.unsubscribe = true;
            axMocks.widget.$scope.model.settings.interactions.publish = false;
            axMocks.widget.$scope.model.settings.interactions.deliver = false;
            axMocks.widget.$scope.$digest();

            expect( axMocks.widget.$scope.model.visibleEventInfos.length ).toEqual( 4 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'offers to filter events _by source type_, using a group of toggle controls (R2.4)', function() {
            axMocks.widget.$scope.model.settings.interactions.subscribe = true;
            axMocks.widget.$scope.model.settings.interactions.unsubscribe = true;

            axMocks.widget.$scope.model.settings.sources.widgets = false;
            axMocks.widget.$scope.model.settings.sources.runtime = true;
            axMocks.widget.$scope.$digest();

            expect( axMocks.widget.$scope.model.visibleEventInfos.length ).toEqual( 2 );
         } );

      } );

   } );

} );
