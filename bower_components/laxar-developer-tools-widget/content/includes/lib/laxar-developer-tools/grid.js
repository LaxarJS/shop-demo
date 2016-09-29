/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/* global chrome */

function axDeveloperToolsToggleGrid( gridSettings ) {
   var hostDocument;
   var id = 'laxar-developer-tools-grid';
   if( window.chrome && chrome.runtime && chrome.runtime.id ) {
      hostDocument = window.document;
   }
   else {
      hostDocument = applicationWindow().document;
   }

   var grid = hostDocument.getElementById( id );
   if( grid === null ) {
      createGrid( id );
   }
   else if( window.getComputedStyle( grid ).getPropertyValue( 'display' ) === 'none' ) {
      grid.style.display = 'block';
   }
   else if( grid !== null && window.getComputedStyle( grid ).getPropertyValue( 'display' ) === 'block' ) {
      grid.style.display = 'none';
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function applicationWindow() {
      return window.opener || window.parent || window;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createGrid( id ){
      var grid = hostDocument.createElement( 'div' );
      grid.setAttribute( 'id', id );
      createSettings();
      Object.keys( gridSettings.css ).forEach( function( key ) {
         grid.style[ key ] = gridSettings.css[ key ];
      } );
      var anchorElement = hostDocument.querySelector( gridSettings.anchor );
      anchorElement.insertBefore(
         grid,
         anchorElement.childNodes[ 0 ]
      );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSettings() {
      gridSettings = {
         anchor: gridSettings.anchor || '[data-ax-page], [ax-page]',
         columns: {
            count: setValue( gridSettings.columns.count, 12 ),
            width: setValue( gridSettings.columns.width, 78 ),
            gutter: setValue( gridSettings.columns.gutter, 26 ),
            padding: setValue( gridSettings.columns.padding, 13 )
         },
         css: gridSettings.css || {}
      };

      var defaultCss = {
         'background-position': gridSettings.columns.padding + 'px 0',
         'margin': '0 auto',
         'padding': '0 ' + gridSettings.columns.padding + 'px',
         'box-sizing': 'content-box',
         'position': 'fixed',
         'top': 0,
         'right': 0,
         'bottom': 0,
         'left': 0,
         'z-index': 100,
         'width': ( gridSettings.columns.count * gridSettings.columns.width +
               ( gridSettings.columns.count - 1 ) * gridSettings.columns.gutter ) +
               'px',
         'background-image': 'url("' + columnBackgroundUri( gridSettings.columns ) + '")'
      };
      gridSettings.css = mergeObjects( gridSettings.css, defaultCss );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setValue( value, defaultValue ) {
         return typeof value === 'undefined' ? defaultValue : value;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function mergeObjects( target, source ) {
         Object.keys( source ).forEach( function( key ) {
            if( !target.hasOwnProperty( key ) ) {
               target[ key ] = source[ key ];
            }
         } );
         return target;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function columnBackgroundUri( settings ) {
      var bgCanvas = document.createElement( 'canvas' );
      var height = 64;
      var width = parseInt( settings.width );
      var padding = parseInt( settings.padding );
      bgCanvas.width = width + parseInt( settings.gutter );
      bgCanvas.height = height;
      var context = bgCanvas.getContext( '2d' );
      // padding
      context.fillStyle = 'rgba(229, 111, 114, 0.25)';
      context.fillRect( 0, 0, padding, height );
      context.fillRect( width - padding, 0, padding, height );
      // column
      context.fillStyle = 'rgba(229, 111, 114, 0.4)';
      context.fillRect( padding, 0, width - 2 * padding, height );
      return bgCanvas.toDataURL();
   }
}
