/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * laxarjs.org
 */
define( [
   '../order_activity',
   'laxar/laxar_testing',
   'pouchdb',
   'json!./spec_data.json'
], function( widgetModule, ax, PouchDb, testData ) {
   'use strict';

   describe( 'A OrderActivity', function() {

      var FAKE_POUCHDB_LATENCY = 10;
      var anyFunction = jasmine.any( Function );
      var testBed;
      var configuration = {
         cart: {
            resource: 'cart'
         },
         order: {
            action: 'order',
            target: 'finishOrder'
         },
         database: {
            pouchDb: {
               'dbId': 'articles'
            }
         }
      };
      var qMock;

      var pouchDb = new PouchDb().constructor.prototype;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( widgetModule.name );
         testBed.featuresMock = features;
         testBed.useWidgetJson();
         testBed.setup();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         qMock = ax.testing.qMock;
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe('with feature cart and configured resource', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as a slave of the resource', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.cart', anyFunction );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.cart', anyFunction );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature order', function() {

         beforeEach( function() {
            setup( configuration );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes for the action request', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'takeActionRequest.order', anyFunction );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'an order request is triggered but no orders were published', function() {

            beforeEach( function() {
               spyOn( ax.log, 'warn' );
               spyOn( pouchDb, 'post' ).andCallFake( function( order, callback ) {
                  var deferred = qMock.defer();
                  setTimeout( function() {
                     deferred.resolve( true );
                  }, FAKE_POUCHDB_LATENCY );
                  return deferred.promise;
               } );

               testBed.eventBusMock.publish( 'takeActionRequest.order', {
                  action: 'order'
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publish a didTakeAction event and logs a warning because of an empty cart', function() {
               expect( testBed.scope.eventBus.publish ).
                  toHaveBeenCalledWith( 'didTakeAction.order.SUCCESS', {
                     action: 'order',
                     outcome: 'SUCCESS'
                  }
               );
               expect( ax.log.warn ).toHaveBeenCalled();
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'orders were published and an order request is triggered', function() {

            beforeEach( function() {
               spyOn( ax.log, 'warn' );
               spyOn( pouchDb, 'post' ).andCallFake( function( order, callback ) {
                  var deferred = qMock.defer();
                  setTimeout( function() {
                     deferred.resolve( true );
                  }, FAKE_POUCHDB_LATENCY );
                  return deferred.promise;
               } );

               testBed.eventBusMock.publish( 'didReplace.cart', {
                  resource: 'cart',
                  data: testData
               } );
               jasmine.Clock.tick( 0 );

               testBed.eventBusMock.publish( 'takeActionRequest.order', {
                  action: 'order'
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a willTakeAction event', function() {
               expect( testBed.scope.eventBus.publish ).
                  toHaveBeenCalledWith( 'willTakeAction.order', {
                     action: 'order'
                  }
               );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when pouchDB successfully saved the entry', function() {

               beforeEach( function() {
                  jasmine.Clock.tick( FAKE_POUCHDB_LATENCY );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'publishes a didTakeAction and a navigateRequest event', function() {
                  expect( testBed.scope.eventBus.publish ).
                     toHaveBeenCalledWith( 'didTakeAction.order.SUCCESS', {
                        action: 'order',
                        outcome: 'SUCCESS'
                     }
                  );
                  expect( testBed.scope.eventBus.publish ).
                     toHaveBeenCalledWith( 'navigateRequest.finishOrder', {
                        target : 'finishOrder',
                        data: {}
                     }
                  );
               } );

            } );

         } );

      } );

   } );

} );
