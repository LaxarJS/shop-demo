var require = {
   baseUrl: 'bower_components',
   paths: {
      // LaxarJS Core:
      requirejs: 'requirejs/require',
      jquery: 'jquery/dist/jquery',
      angular: 'angular/angular',
      'angular-mocks': 'angular-mocks/angular-mocks',
      'angular-route': 'angular-route/angular-route',
      'angular-sanitize': 'angular-sanitize/angular-sanitize',
      jjv: 'jjv/lib/jjv',
      jjve: 'jjve/jjve',

      // LaxarJS Core Testing:
      jasmine: 'jasmine/lib/jasmine-core/jasmine',
      q_mock: 'q_mock/q',

      // LaxarJS Core Legacy:
      text: 'requirejs-plugins/lib/text',
      json: 'requirejs-plugins/src/json',

      // App Parts:
      'laxar-path-root': '..',
      'laxar-path-layouts': '../application/layouts',
      'laxar-path-pages': '../application/pages',
      'laxar-path-widgets': '../includes/widgets',
      'laxar-path-themes': '../includes/themes',
      'laxar-path-flow': '../application/flow/flow.json',

      'laxar-application-dependencies': '../var/static/laxar_application_dependencies',

      'laxar': 'laxar/dist/laxar',
      'laxar/laxar_testing': 'laxar/dist/laxar_testing',
      'laxar-uikit': 'laxar-uikit/dist/laxar-uikit',
      'laxar-uikit/controls': 'laxar-uikit/dist/controls',
      'laxar-path-default-theme': 'laxar-uikit/dist/themes/default.theme'
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
      }
   ],
   shim: {
      angular: {
         exports: 'angular'
      },
      'angular-mocks': {
         deps: [
            'angular'
         ],
         init: function ( angular ) {
            'use strict';
            return angular.mock;
         }
      },
      'angular-route': {
         deps: [
            'angular'
         ],
         init: function ( angular ) {
            'use strict';
            return angular;
         }
      },
      'angular-sanitize': {
         deps: [
            'angular'
         ],
         init: function ( angular ) {
            'use strict';
            return angular;
         }
      }
   }
};
