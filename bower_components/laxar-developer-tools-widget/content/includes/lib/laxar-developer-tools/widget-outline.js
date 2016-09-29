/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/* global chrome */
var axDeveloperToolsToggleWidgetOutline = (function() {
   var infoId;
   var isBrowserWebExtension;
   var document;

   var INFO_LAYER_STYLE = {
      'position': 'fixed',
      'top': '-5px',
      'left': '-5px',
      'box-shadow': '2px 2px 15px rgba(0,0,0,0.5)',
      'z-index': 1000,
      'padding': '0.5em 1em 0.75em',
      'border-right': '1px solid white',
      'border-bottom': '1px solid white',
      'border-radius': '0 0 20px 0',
      'backgroundColor': '#ff9900',
      'color': 'white'
   };

   return function() {
      infoId = infoId ||'laxar-developer-tools-info-box';
      isBrowserWebExtension = isBrowserWebExtension || ( window.chrome && chrome.runtime && chrome.runtime.id );
      document = hostDocument();

      var cssClassName = 'ax-developer-tools-widget-outline';
      var widgets = document.querySelectorAll( '[data-ax-widget-area] > div' );
      for( var j = 0; j < widgets.length; ++j ) {
         if( widgets[ j ].classList.contains( cssClassName ) ){
            widgets[ j ].removeEventListener( 'mouseover', listener, false );
            widgets[ j ].classList.remove( cssClassName );
         }
         else {
            widgets[ j ].classList.add( cssClassName );
            widgets[ j ].addEventListener( 'mouseover', listener, false );
         }
      }
      var info = document.getElementById( infoId );
      if( info ) {
         info.parentNode.removeChild( info );
      }
   };

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function listener( event ){
      var widgetClass = this.className.split( /\s+/ ).filter( function( _ ) {
         return !!_.match( /(-widget|-activity)$/ );
      } ).concat( 'unknown' )[ 0 ];
      infoLayer().innerHTML = '<strong>' + widgetClass + '</strong><br>ID: ' + this.id ;
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function infoLayer() {
      var info = document.getElementById( infoId );

      if( !info ) {
         info = document.createElement( 'div' );
         info.setAttribute( 'id', infoId );
         Object.keys( INFO_LAYER_STYLE ).forEach( function( key ) {
            info.style[ key ] = INFO_LAYER_STYLE[ key ];
         } );
         document.body.appendChild( info );
      }
      info.addEventListener( 'click', function( event ) {
         this.remove();
      } );
      return info;
   }

   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function hostDocument() {
      if( isBrowserWebExtension ) {
         return window.document;
      }
      else {
         return ( window.opener || window.parent || window ).document;
      }
   }
})();
