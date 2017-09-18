/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license
 */
/* global require */
import vue from 'vue';
vue.config.productionTip = false;

import 'laxar/dist/polyfills';

import i18next from 'i18next';
import i18nextXhrBackend from 'i18next-xhr-backend';
import i18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';

import { create } from 'laxar';
import * as vueAdapter from 'laxar-vue-adapter';
import artifacts from 'laxar-loader/artifacts?flow=main&theme=cube';
import debugInfo from 'laxar-loader/debug-info?lazy&flow=main&theme=cube';

const configuration = {
   name: 'shop-demo',
   logging: { threshold: 'TRACE' },
   theme: 'cube',
   router: {
      navigo: { useHash: true }
   }
};

i18next
   .use(i18nextXhrBackend)
   .use(i18nextBrowserLanguageDetector)
   .init({
      fallbackLng: 'en',
      debug: true,
      ns: [ 'special', 'common' ],
      defaultNS: 'special',
      backend: {
         ajax(url, options, callback, data) {
            try {
               let waitForLocale = require(`bundle-loader!i18next-po-loader!./locales/${url}.po`);
               waitForLocale( locale => {
                  console.log( locale );
                  callback( locale, {status: '200'} );
               } )
            } catch (e) {
               callback(null, {status: '404'});
            }
         },
         parse: data => data,
         loadPath: '{{lng}}/{{ns}}',
         crossDomain: false
      }
   }, (err, t) => {
      if( err ) {
         console.log('init error', err);
      }
      else {
         console.log('initialized', t, i18next);
      }
   })
   .on('languageChanged', lng => {
   });

create( [ vueAdapter ], artifacts, configuration )
   .tooling( debugInfo )
   .flow( 'main', document.querySelector( '[data-ax-page]' ) )
   .bootstrap();
