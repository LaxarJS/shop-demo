/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar-mocks'
], function( descriptor, axMocks ) {
   'use strict';

   describe( 'The developer-toolbar-widget', function() {

      var testBed;

      beforeEach( axMocks.createSetupForWidget( descriptor ) );

      beforeEach( function() {
         axMocks.widget.configure( {
            grid: {
               resource: 'gridSettings'
            }
         } );
      } );

      beforeEach( axMocks.widget.load );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows for the grid visualization layer to be configured through a resource (R2.2)', function() {
         expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith( 'didReplace.gridSettings', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

   } );
} );
