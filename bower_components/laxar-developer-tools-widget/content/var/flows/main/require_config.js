/*jshint quotmark:false,-W079*/
var require = { 
   "baseUrl": "bower_components", 
   "deps": [], 
   "paths": { 
      "laxar": "laxar/dist/laxar.with-deps", 
      "requirejs": "requirejs/require", 
      "text": "requirejs-plugins/lib/text", 
      "json": "requirejs-plugins/src/json", 
      "angular": "angular/angular", 
      "angular-mocks": "angular-mocks/angular-mocks", 
      "angular-route": "angular-route/angular-route", 
      "angular-sanitize": "angular-sanitize/angular-sanitize", 
      "laxar-patterns": "laxar-patterns/dist/laxar-patterns", 
      "json-patch": "fast-json-patch/src/json-patch-duplex", 
      "laxar-uikit": "laxar-uikit/dist/laxar-uikit", 
      "laxar-uikit/controls": "laxar-uikit/dist/controls", 
      "jquery": "jquery/dist/jquery", 
      "bootstrap": "bootstrap-sass-official/assets/javascripts/bootstrap", 
      "laxar-path-root": "..", 
      "laxar-path-layouts": "../application/layouts", 
      "laxar-path-pages": "../application/pages", 
      "laxar-path-flow": "../application/flow/flow.json", 
      "laxar-path-widgets": "../includes/widgets", 
      "laxar-path-themes": "../includes/themes", 
      "laxar-path-default-theme": "laxar-uikit/dist/themes/default.theme", 
      "laxar-application-dependencies": "../var/static/laxar_application_dependencies", 
      "laxar-mocks": "laxar-mocks/dist/laxar-mocks", 
      "jasmine2": "jasmine2/lib/jasmine-core/jasmine", 
      "promise-polyfill": "promise-polyfill/Promise", 
      "laxar-react-adapter": "laxar-react-adapter/laxar-react-adapter", 
      "react": "react/react", 
      "react-dom": "react/react-dom", 
      "lodash": "lodash/lodash", 
      "dagre": "dagre/dist/dagre.core", 
      "graphlib": "graphlib/dist/graphlib.core", 
      "immutable": "immutable/dist/immutable", 
      "jjv": "jjv/lib/jjv", 
      "jjve": "jjve/jjve", 
      "laxar/laxar_testing": "laxar/dist/laxar_testing", 
      "jasmine": "jasmine/lib/jasmine-core/jasmine", 
      "q_mock": "q_mock/q"
   }, 
   "packages": [
      { 
         "name": "laxar-application", 
         "location": "..", 
         "main": "init"
      },
      { 
         "name": "moment", 
         "location": "moment", 
         "main": "moment"
      },
      { 
         "name": "wireflow", 
         "location": "wireflow/build", 
         "main": "wireflow"
      }
   ], 
   "shim": { 
      "angular": { 
         "deps": [], 
         "exports": "angular"
      }, 
      "angular-mocks": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular.mock;
         }
      }, 
      "angular-route": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular;
         }
      }, 
      "angular-sanitize": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular;
         }
      }, 
      "bootstrap/tooltip": [
         "jquery"
      ], 
      "json-patch": { 
         "exports": "jsonpatch"
      }, 
      "lodash": { 
         "exports": "_"
      }, 
      "graphlib": { 
         "deps": [
            "lodash"
         ], 
         "exports": "graphlib"
      }, 
      "dagre": { 
         "deps": [
            "graphlib",
            "lodash"
         ], 
         "exports": "dagre"
      }, 
      "bootstrap/affix": [
         "jquery"
      ]
   }, 
   "map": { 
      "bower_components/laxar-input-control": { 
         "laxar": "laxar/dist/laxar"
      }
   }
};
