/* global -require */
var require = {
   baseUrl: 'bower_components',
   deps: [],
   paths: {
      // LaxarJS Core and dependencies:
      laxar: 'laxar/dist/laxar.with-deps',
      requirejs: 'requirejs/require',
      text: 'requirejs-plugins/lib/text',
      json: 'requirejs-plugins/src/json',
      angular: 'angular/angular',
      'angular-mocks': 'angular-mocks/angular-mocks',
      'angular-route': 'angular-route/angular-route',
      'angular-sanitize': 'angular-sanitize/angular-sanitize',

      // LaxarJS Patterns:
      'laxar-patterns': 'laxar-patterns/dist/laxar-patterns',
      'json-patch': 'fast-json-patch/src/json-patch-duplex',

      // LaxarJS UIKit:
      'laxar-uikit': 'laxar-uikit/dist/laxar-uikit',
      'laxar-uikit/controls': 'laxar-uikit/dist/controls',

      // LaxarJS Core (tests only), ax-affix-control, ax-input-control:
      jquery: 'jquery/dist/jquery',
      bootstrap: 'bootstrap-sass-official/assets/javascripts/bootstrap',

      // LaxarJS application paths:
      'laxar-path-root': '..',
      'laxar-path-layouts': '../application/layouts',
      'laxar-path-pages': '../application/pages',
      'laxar-path-flow': '../application/flow/flow.json',
      'laxar-path-widgets': '../includes/widgets',
      'laxar-path-themes': '../includes/themes',
      'laxar-path-default-theme': 'laxar-uikit/dist/themes/default.theme',

      // LaxarJS application modules (contents are generated):
      'laxar-application-dependencies': '../var/static/laxar_application_dependencies',

      // New-style testing:
      'laxar-mocks': 'laxar-mocks/dist/laxar-mocks',
      jasmine2: 'jasmine2/lib/jasmine-core/jasmine',
      'promise-polyfill': 'promise-polyfill/Promise',

      // React support (ax-page-inspector-widget):
      'laxar-react-adapter': 'laxar-react-adapter/laxar-react-adapter',
      'react': 'react/react',
      'react-dom': 'react/react-dom',
      // dagre library (ax-page-inspector-widget):
      lodash: 'lodash/lodash',
      dagre: 'dagre/dist/dagre.core',
      graphlib: 'graphlib/dist/graphlib.core',
      // Immutable.js library (ax-page-inspector-widget):
      immutable: 'immutable/dist/immutable'
   },
   packages: [
      {
         name: 'laxar-application',
         location: '..',
         main: 'init'
      },
      {
         name: 'moment',
         location: 'moment',
         main: 'moment'
      },
      {
         name: 'wireflow',
         location: 'wireflow/build',
         main: 'wireflow'
      }
   ],
   shim: {
      angular: {
         // use `deps: [ 'jquery' ]` if you use jquery and need a jQuery-compatible angular.element()
         deps: [],
         exports: 'angular'
      },
      'angular-mocks': {
         deps: [ 'angular' ],
         init: function( angular ) {
            'use strict';
            return angular.mock;
         }
      },
      'angular-route': {
         deps: [ 'angular' ],
         init: function( angular ) {
            'use strict';
            return angular;
         }
      },
      'angular-sanitize': {
         deps: [ 'angular' ],
         init: function( angular ) {
            'use strict';
            return angular;
         }
      },
      // LaxarJS Patterns
      'json-patch': {
         exports: 'jsonpatch'
      },
      lodash: { exports: '_' },
      graphlib: { deps: [ 'lodash' ], exports: 'graphlib' },
      dagre: { deps: [ 'graphlib', 'lodash' ], exports: 'dagre' },
      // ax-affix-control, ax-input-control:
      'bootstrap/affix': [ 'jquery' ],
      'bootstrap/tooltip': [ 'jquery' ]
   }
};
