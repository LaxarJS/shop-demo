/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
// See https://github.com/LaxarJS/laxar/blob/master/docs/manuals/configuration.md
window.laxar = ( function() {
   'use strict';

   var modeAttribute = 'data-ax-application-mode';
   var mode = document.querySelector( 'script[' + modeAttribute + ']' ).getAttribute( modeAttribute );

   return {
      name: 'contents',
      description: 'LaxarJS Developer Tools',

      theme: 'default',
      useMergedCss: mode === 'PRODUCTION',
      useEmbeddedFileListings: mode === 'PRODUCTION'
   };

} )();
