/**
 * Copyright 2016
 * Released under the MIT license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'laxar-react-adapter'
], function( descriptor, axMocks, axReactAdapter ) {
   'use strict';

   // Minimalistic test setup. More information:
   // https://github.com/LaxarJS/laxar-mocks/blob/master/docs/manuals/index.md

   describe( 'The page-inspector-widget', function() {

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: [],
         adapter: axReactAdapter
      } ) );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         axMocks.widget.configure( {
            pageInfo: {
               resource: 'page'
            }
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( axMocks.widget.load );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'can be instantiated successfully', function() {
         expect( true ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

   } );

} );
