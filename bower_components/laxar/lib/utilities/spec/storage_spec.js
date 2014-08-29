/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../storage'
], function( storage ) {
   'use strict';

   describe( 'storage', function() {

      var fakeLocalStorage_;
      var fakeSessionStorage_;

      beforeEach( function() {
         fakeLocalStorage_ = createFakeStorage();
         fakeSessionStorage_ = createFakeStorage();
         storage.init( fakeLocalStorage_, fakeSessionStorage_ );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'getItem, setItem and removeItem calls will be redirected to the provided storage backends', function() {

         storage.getLocalStorage( 'x' ).setItem( 'A', '4711' );
         expect( fakeLocalStorage_.setItem ).toHaveBeenCalledWith( 'ax.x.A', '"4711"' );

         storage.getLocalStorage( 'y' ).getItem( 'B' );
         expect( fakeLocalStorage_.getItem ).toHaveBeenCalledWith( 'ax.y.B' );

         storage.getLocalStorage( 'z' ).removeItem( 'C' );
         expect( fakeLocalStorage_.removeItem ).toHaveBeenCalledWith( 'ax.z.C' );

         storage.getSessionStorage( 1 ).setItem( 'i1', '4711' );
         expect( fakeSessionStorage_.setItem ).toHaveBeenCalledWith( 'ax.1.i1', '"4711"' );

         storage.getSessionStorage( 2 ).getItem( 'i2' );
         expect( fakeSessionStorage_.getItem ).toHaveBeenCalledWith( 'ax.2.i2' );

         storage.getSessionStorage( 3 ).removeItem( 'i3' );
         expect( fakeSessionStorage_.removeItem ).toHaveBeenCalledWith( 'ax.3.i3' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'can store and retrieve objects and strings', function() {
         var donald = {
            id: 4711,
            name: 'Donald',
            nephews: [ 'Huey', 'Dewey', 'Louie'],
            income: 0.5,
            lover: null,
            address: {
               city: 'Ducktown'
            }
         };

         var localStorage = storage.getLocalStorage( 'X' );

         localStorage.setItem( 'duck', donald );
         expect( localStorage.getItem( 'duck' ) ).toEqual( donald );

         localStorage.setItem( 'name', 'Daisy Duck' );
         expect( localStorage.getItem( 'name') ).toBe( 'Daisy Duck' );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when localStorage or sessionStorage are not available', function() {

      var origSessionSetItem;
      var origLocalSetItem;
      var localStorage;
      var sessionStorage;

      beforeEach( function() {
         window.localStorage.removeItem( 'myTestKey' );
         window.sessionStorage.removeItem( 'myTestKey' );

         origSessionSetItem = window.sessionStorage.setItem;
         origLocalSetItem = window.localStorage.setItem;
         window.sessionStorage.setItem = function() { throw new Error( 'no browser storage' ); };
         window.localStorage.setItem = function() { throw new Error( 'no browser storage' ); };

         storage.init();
         localStorage = storage.getLocalStorage( 'X' );
         sessionStorage = storage.getSessionStorage( 'X' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         window.sessionStorage.setItem = origSessionSetItem;
         window.localStorage.setItem = origLocalSetItem;

         window.localStorage.removeItem( 'myTestKey' );
         window.sessionStorage.removeItem( 'myTestKey' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses an in memory replacement for localStorage', function() {
         localStorage.setItem( 'myTestKey', 12 );

         expect( window.localStorage.getItem( 'myTestKey' ) ).toEqual( null );
         expect( localStorage.getItem( 'myTestKey' ) ).toEqual( 12 );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses window.name as replacement for sessionStorage', function() {
         sessionStorage.setItem( 'myTestKey',  12 );

         expect( window.sessionStorage.getItem( 'myTestKey' ) ).toEqual( null );
         expect( sessionStorage.getItem( 'myTestKey' ) ).toEqual( 12 );
         expect( JSON.parse( window.name ) ).toEqual( {
            'ax.X.myTestKey': '12' // when inspecting window.name this is still a string, which is okay
         } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createFakeStorage() {
      var store = {};
      var api = {
         getItem: function( key ) {
            return store[ key ];
         },
         setItem: function( key, val ) {
            store[ key ] = val;
         },
         removeItem: function( key ) {
            delete store[ key ];
         }
      };
      Object.keys( api ).forEach( function( method ) {
         spyOn( api, method ).andCallThrough();
      } );
      return api;
   }

} );
