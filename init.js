/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license
 */
/* global require */
import vue from 'vue';
vue.config.productionTip = false;

import 'laxar/dist/polyfills';

import { create } from 'laxar';
import * as vueAdapter from 'laxar-vue-adapter';

const configuration = {
   name: 'shop-demo',
   logging: { threshold: 'TRACE' },
   theme: 'cube',
   router: {
      navigo: { useHash: true }
   }
};

function fetchAndEval( url ) {
   function run( code ) {
      var exports = {};
      var module = { exports };
      var fn = new Function( 'module', 'exports', code );
      fn.call( window, module, exports );
      console.log(module);
      return module.exports;
   }

   return fetch( url )
      .then( response => response.text() )
      .then( run );
}

Promise.all( [
   fetchAndEval( '/build/artifacts1.bundle.js' ),
   fetchAndEval( '/build/artifacts2.bundle.js' ),
] ).then( ( [ artifacts, ...additionalArtifacts ] ) => {
   mergeArtifacts( artifacts, ...additionalArtifacts );
   create( [ vueAdapter ], artifacts, configuration )
      .flow( 'main', document.querySelector( '[data-ax-page]' ) )
      .bootstrap();
} ).catch( err => {
   console.error( err );
} );

function mergeArtifacts( artifacts, ...additionalArtifacts ) {
   additionalArtifacts.forEach( bundle => {
      Object.keys( bundle.aliases ).forEach( bucket => {
         if( !artifacts.aliases[ bucket ] ) {
            artifacts.aliases[ bucket ] = bundle.aliases[ bucket ];
            artifacts[ bucket ] = bundle[ bucket ];
            return;
         }

         Object.keys( bundle.aliases[ bucket ] ).forEach( key => {
            const index = bundle.aliases[ bucket ][ key ];
            const artifact = bundle[ bucket ][ index ];
            const existing = artifacts.aliases[ bucket ][ key ];

            if( existing !== undefined ) {
               artifacts[ bucket ][ existing ] = artifact;
            }
            else {
               artifacts.aliases[ bucket ][ key ] = artifacts[ bucket ].length;
               artifacts[ bucket ].push( artifact );
            }
         } );
      } );
   } );
   return artifacts;
}

