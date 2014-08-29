/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'require'
], function( require ) {
   'use strict';

   return {
      PRODUCT: require.toUrl( 'laxar-path-root' ),
      THEMES: require.toUrl( 'laxar-path-themes' ),
      LAYOUTS: require.toUrl( 'laxar-path-layouts' ),
      WIDGETS: require.toUrl( 'laxar-path-widgets' ),
      PAGES: require.toUrl( 'laxar-path-pages' ),
      FLOW_JSON: require.toUrl( 'laxar-path-flow' ),
      DEFAULT_THEME: require.toUrl( 'laxar_uikit/themes/default.theme' )
   };

} );
