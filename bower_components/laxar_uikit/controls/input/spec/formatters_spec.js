/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar_uikit/controls/input/formatters'
], function( formatters ) {
   'use strict';

   var format;

   describe( 'A formatter', function() {

      describe( 'for strings', function() {

         beforeEach( function() {
            format = formatters.create( 'string', {} );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should return the empty string for null and undefined', function() {
            expect( format( null ) ).toEqual( '' );
            expect( format( undefined ) ).toEqual( '' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should return just what it gets as string for anything else', function() {
            expect( format( 'Some String' ) ).toEqual( 'Some String' );
            expect( format( 666 ) ).toEqual( '666' );
            expect( format( true ) ).toEqual( 'true' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for decimals', function() {

         beforeEach( function() {
            format = formatters.create( 'decimal', {
               groupingSeparator: '.',
               decimalSeparator: ',',
               decimalPlaces: 2
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should return the empty string for null and undefined', function() {
            expect( format( null ) ).toEqual( '' );
            expect( format( undefined ) ).toEqual( '' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should throw a type error for non-numeric types', function() {
            expect( function() { format( true ); } )
               .toThrow( 'Expected argument of type number, but got "boolean". Value: true' );
            expect( function() { format( 'Hello' ); } )
               .toThrow( 'Expected argument of type number, but got "string". Value: Hello' );
            expect( function() { format( new Date() ); } ).toThrow(); // Spare testing for the date string ...
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should format numbers according to the given format options', function() {
            expect( format( 12 ) ).toEqual( '12,00' );
            expect( format( 12.345 ) ).toEqual( '12,35' );
            expect( format( 5123789.345 ) ).toEqual( '5.123.789,35' );

            expect( format( -12 ) ).toEqual( '-12,00' );
            expect( format( -12.345 ) ).toEqual( '-12,34' );
            expect( format( -5123789.345 ) ).toEqual( '-5.123.789,34' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should format numerical strings according to the given format options', function() {
            expect( format( '-12.345' ) ).toEqual( '-12,34' );
            expect( format( '+12.345' ) ).toEqual( '12,35' );
            expect( format( '12.345' ) ).toEqual( '12,35' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for integers', function() {

         beforeEach( function() {
            format = formatters.create( 'integer', {
               groupingSeparator: '.'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should return the empty string for null and undefined', function() {
            expect( format( null ) ).toEqual( '' );
            expect( format( undefined ) ).toEqual( '' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should throw a type error for non-numeric types', function() {
            expect( function() { format( true ); } )
               .toThrow( 'Expected argument of type number, but got "boolean". Value: true' );
            expect( function() { format( 'Hello' ); } )
               .toThrow( 'Expected argument of type number, but got "string". Value: Hello' );
            expect( function() { format( new Date() ); } ).toThrow(); // Spare testing for the date string ...
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should format numbers according to the given format options', function() {
            expect( format( 12 ) ).toEqual( '12' );
            expect( format( 12.67 ) ).toEqual( '13' );
            expect( format( 5123789.345 ) ).toEqual( '5.123.789' );

            expect( format( -12 ) ).toEqual( '-12' );
            expect( format( -12.57 ) ).toEqual( '-13' );
            expect( format( -5123789.345 ) ).toEqual( '-5.123.789' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should format numerical strings according to the given format options', function() {
            expect( format( '-12.345' ) ).toEqual( '-12' );
            expect( format( '+12.345' ) ).toEqual( '12' );
            expect( format( '12.345' ) ).toEqual( '12' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for date', function() {

         beforeEach( function() {
            format = formatters.create( 'date', {
               dateFormat: 'DD.MM.YYYY'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should return the empty string for null and undefined', function() {
            expect( format( null ) ).toEqual( '' );
            expect( format( undefined ) ).toEqual( '' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should throw a type error for non ISO-8601-like date strings', function() {
            expect( function() { format( true ); } )
               .toThrow( 'Expected argument as ISO-8601 date string of the form YYYY-MM-DD, but got "boolean". Value: true' );
            expect( function() { format( 'Hello' ); } )
               .toThrow( 'Expected argument as ISO-8601 date string of the form YYYY-MM-DD, but got "string". Value: Hello' );
            expect( function() { format( new Date() ); } ).toThrow(); // Spare testing for the date string ...
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should format ISO-8601-like date strings to the given format', function() {
            expect( format( '1962-01-04' ) ).toEqual( '04.01.1962' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for time', function() {

         beforeEach( function() {
            format = formatters.create( 'time', {
               timeFormat: 'HH:mm:ss'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should return the empty string for null and undefined', function() {
            expect( format( null ) ).toEqual( '' );
            expect( format( undefined ) ).toEqual( '' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should throw a type error for non ISO-8601-like time strings', function() {
            expect( function() { format( true ); } )
               .toThrow( 'Expected argument as ISO-8601 time string of the form HH:mm:ss, but got "boolean". Value: true' );
            expect( function() { format( 'Hello' ); } )
               .toThrow( 'Expected argument as ISO-8601 time string of the form HH:mm:ss, but got "string". Value: Hello' );
            expect( function() { format( new Date() ); } ).toThrow(); // Spare testing for the date string ...
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'should format ISO-8601-like date strings to the given format', function() {
            expect( format( '11:23:45' ) ).toEqual( '11:23:45' );
            expect( format( '23:12:35' ) ).toEqual( '23:12:35' );
         } );

      } );

   } );

} );