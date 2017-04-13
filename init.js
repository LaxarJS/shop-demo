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
import artifacts from 'laxar-loader/artifacts?flow=main&theme=cube';

const configuration = {
   name: 'shop-demo',
   logging: { threshold: 'TRACE' },
   theme: 'cube',
   router: {
      navigo: { useHash: true }
   }
};

create( [ vueAdapter ], artifacts, configuration )
   .tooling( require( 'laxar-loader/debug-info?flow=main&theme=cube' ) )
   .flow( 'main', document.querySelector( '[data-ax-page]' ) )
   .bootstrap();
