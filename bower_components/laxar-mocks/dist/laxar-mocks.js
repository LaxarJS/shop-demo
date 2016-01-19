/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar-mocks/lib/helpers',[
   'require'
], function( require ) {
   'use strict';

   function requireWithPromise( requirements, optionalContextBoundRequire ) {
      return new Promise( function( resolve, reject ) {
         ( optionalContextBoundRequire || require )( requirements, function( /* modules */ ) {
            resolve( Array.prototype.slice.call( arguments, 0 ) );
         }, function( err ) {
            reject( new Error( err ) );
         } );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function legacyQ() {
      // for now our core is stuck to the legacy q api with defer and such, as it uses $q from AngularJS 1.x
      return {
         defer: defer,
         all: Promise.all.bind( Promise ),
         resolve: Promise.resolve.bind( Promise ),
         reject: Promise.reject.bind( Promise ),
         when: Promise.resolve.bind( Promise )
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function defer() {
      var deferred = {};
      deferred.promise = new Promise( function( resolve, reject ) {
         deferred.resolve = resolve;
         deferred.reject = reject;
      } );
      return deferred;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      require: requireWithPromise,
      legacyQ: legacyQ
   };

} );

/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar-mocks/lib/mini_http',[
   'laxar'
], function( ax ) {
   'use strict';

   var cache = {};

   function get( url, optionalHeaders ) {
      var headers = optionalHeaders || {};
      var xhr = new XMLHttpRequest();

      if( url in cache ) {
         return cache[ url ];
      }

      cache[ url ] = new Promise( function( resolve, reject ) {
         xhr.onreadystatechange = function() {
            try {
               if( xhr.readyState === 4 ) {
                  if( xhr.status >= 200 && xhr.status <= 299 ) {
                     resolve( {
                        data: xhr.responseText,
                        status: xhr.status
                     } );
                  }
                  else {
                     reject( {
                        message: 'Failed to load file: ' + url,
                        data: xhr.responseText,
                        status: xhr.status,
                        xhr: xhr
                     } );
                  }
                  xhr.onreadystatechange = null;
                  xhr = null;
               }
            }
            catch( e ) {
               reject( e );
            }
         };

         xhr.open( 'GET', url , true );
         xhr.setRequestHeader( 'Cache-Control', 'no-cache' );

         Object.keys( headers ).forEach( function( headerKey ) {
            xhr.setRequestHeader( headerKey, headers[ headerKey ] );
         } );

         xhr.send( null );
      } );

      return cache[ url ];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getJson( url, optionalHeaders ) {
      var headers = ax.object.options( optionalHeaders, { 'Accept': 'application/json' } );

      return get( url, headers )
         .then( function( response ) {
            return JSON.parse( response.data );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      get: get,
      head: get, // sufficient for tests
      getJson: getJson
   };

} );

/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar-mocks/lib/widget_spec_initializer',[
   'require',
   'laxar',
   './helpers',
   './mini_http'
], function( require, ax, helpers, http ) {
   'use strict';

   var path = ax._tooling.path;

   function createSetupForWidget( specContext, widgetInfo, widgetPrivateApi, widgetDescriptor ) {
      return loadWidget( specContext, widgetDescriptor )
         .then( setupWidgetInfo.bind( null, specContext, widgetInfo, widgetPrivateApi, widgetDescriptor ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function loadWidget( specContext, widgetDescriptor ) {
      var widgetDirectory = path.join( specContext.absSpecLocation, '..' );
      var requireWidgetDirectory = path.relative( require.toUrl( '.' ), widgetDirectory );
      var filename = widgetDescriptor.name.replace( /(.)([A-Z])/g, '$1-$2' ).toLowerCase();

      return getControlReferences( widgetDescriptor )
         .then( function( controls ) {
            var deps = [ path.join( requireWidgetDirectory, filename ) ].concat( controls );
            return helpers.require( deps );
         } )
         .then( function( modules ) {
            return registerModules( specContext, modules[ 0 ], modules.slice( 1 ), widgetDescriptor.integration.technology );
         } )
         .then( function() {
            return {
               id: 'testWidget',
               widget: path.relative( require.toUrl( 'laxar-path-widgets' ), widgetDirectory )
            };
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function setupWidgetInfo( specContext, widgetInfo, widgetPrivateApi, widgetDescriptor, basicWidgetConfiguration ) {
      ax._tooling.fileResourceProvider.init( helpers.legacyQ(), http );

      var cssLoader = { load: function() {} };
      var applicationRootPath = ax._tooling.path.normalize( require.toUrl( 'laxar-path-root' ) );
      var fileResourceProvider = ax._tooling.fileResourceProvider.create( applicationRootPath );
      if( specContext.options.knownMissingResources.length > 0 ) {
         decorateFileResourceProvider( fileResourceProvider, specContext.options.knownMissingResources );
      }
      var themeManager = ax._tooling.themeManager.create( fileResourceProvider, helpers.legacyQ(), 'default' );

      widgetPrivateApi.featureConfiguration = {};
      widgetPrivateApi.configure = function( key, val ) {
         if( arguments.length === 2 ) {
            ax.object.setPath( widgetPrivateApi.featureConfiguration, key, ax.object.deepClone( val ) );
         }
         else {
            widgetPrivateApi.featureConfiguration = ax.object.deepClone( key );
         }
      };
      widgetPrivateApi.load = function() {
         var configuration = ax.object.options( basicWidgetConfiguration, {
            features: widgetPrivateApi.featureConfiguration || {}
         } );


         return ax._tooling.widgetLoader
            .create( helpers.legacyQ(), {
               axControls: ax._tooling.controlsService.create( fileResourceProvider ),
               axFileResourceProvider: fileResourceProvider,
               axThemeManager: themeManager,
               axCssLoader: cssLoader,
               axGlobalEventBus: specContext.eventBus
            } )
            .load( configuration, {
               onBeforeControllerCreation: function( environment, injections ) {
                  [ 'subscribe', 'publish', 'publishAndGatherReplies' ].forEach( function( method ) {
                     spyOn( environment.context.eventBus, method ).and.callThrough();
                  } );
                  ax.object.forEach( injections, function( value, key ) {
                     widgetInfo[ key ] = value;
                  } );
               }
            } )
            .then( function( loadingInfo ) {
               return loadingInfo.templatePromise
                  .then( function( template ) {
                     widgetPrivateApi.destroy = loadingInfo.destroy;
                     widgetPrivateApi.renderTo = function( container ) {
                        loadingInfo.adapter.domAttachTo( container, template );

                        var adapterFactory = ax._tooling.widgetAdapters
                           .getFor( widgetDescriptor.integration.technology );
                        if( adapterFactory.applyViewChanges ) {
                           adapterFactory.applyViewChanges();
                        }
                     };
                  } );
            } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function registerModules( specContext, widgetModule, controlModules, widgetTechnology ) {
      var adapter = ax._tooling.widgetAdapters.getFor( widgetTechnology );
      if( !adapter ) {
         ax.log.error( 'Unknown widget technology: [0]', widgetTechnology );
         return Promise.reject( new Error( 'Unknown widget technology: ' + widgetTechnology ) );
      }

      return helpers.require( [ 'angular-mocks' ] )
         .then( function( modules ) {
            var ngMocks = modules[ 0 ];
            var adapterModule = adapter.bootstrap( [ widgetModule ] );

            if( widgetTechnology === 'angular' ) {
               ngMocks.module( ax._tooling.runtimeDependenciesModule.name );
               ngMocks.module( adapterModule.name );
               controlModules.forEach( function( controlModule ) {
                  if( controlModule.name ) {
                     ngMocks.module( controlModule.name );
                  }
               } );
            }

            ngMocks.inject( function( $q ) {
               // Support mocked promises created by the event bus:
               ax._tooling.eventBus.init( $q, specContext.eventBusTick, specContext.eventBusTick );
               // Support mocked promises created by libraries:
               ax._tooling.provideQ = function() { return $q; };
            } );
            return adapter;
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getControlReferences( widgetJson ) {
      var controlRefs = widgetJson.controls || [];

      return Promise.all( controlRefs.map( function( controlRef ) {
         // By appending .json afterwards, trick RequireJS into generating the correct descriptor path when
         // loading from a 'package'.
         return http.getJson( require.toUrl( controlRef + '/control' ) + '.json' )
            .then( function( controlJson ) {
               return controlRef + '/' + controlJson.name;
            } );
      } ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function decorateFileResourceProvider( fileResourceProvider, knownMissingResources ) {
      var origIsAvailable = fileResourceProvider.isAvailable.bind( fileResourceProvider );
      var origProvide = fileResourceProvider.provide.bind( fileResourceProvider );

      fileResourceProvider.isAvailable = function( url ) {
         return notAvailable( url ) ? Promise.resolve( false ) : origIsAvailable( url );
      };

      fileResourceProvider.provide  = function( url ) {
         return notAvailable( url ) ? Promise.reject() : origProvide( url );
      };

      function notAvailable( url ) {
         return knownMissingResources.some( function( missingResource ) {
            if( missingResource instanceof RegExp ) {
               return missingResource.test( url );
            }
            return url.indexOf( '' + missingResource ) !== -1;
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      createSetupForWidget: createSetupForWidget
   };

} );

/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 *
 * with parts by Pivotal Labs
 * Copyright (c) 2008-2015 Pivotal Labs
 * license found at https://raw.githubusercontent.com/jasmine/jasmine/master/MIT.LICENSE
 */
define( 'laxar-mocks/lib/jasmine_boot',[
   'laxar'
], function( ax ) {
   'use strict';

   function create( optionalJasmineEnv ) {
      if( optionalJasmineEnv ) {
         return createRunner( optionalJasmineEnv );
      }

      /**
       * ## Require &amp; Instantiate
       *
       * Require Jasmine's core files. Specifically, this requires and attaches all of Jasmine's code to the `jasmine` reference.
       */
      window.jasmine = jasmineRequire.core(jasmineRequire);

      /**
       * Since this is being run in a browser and the results should populate to an HTML page, require the HTML-specific Jasmine code, injecting the same reference.
       */
      jasmineRequire.html(jasmine);

      /**
       * Create the Jasmine environment. This is used to run all specs in a project.
       */
      var env = jasmine.getEnv();

      /**
       * ## The Global Interface
       *
       * Build up the functions that will be exposed as the Jasmine public interface. A project can customize, rename or alias any of these functions as desired, provided the implementation remains unchanged.
       */
      var jasmineInterface = jasmineRequire.interface(jasmine, env);

      /**
       * Add all of the Jasmine global/public interface to the global scope, so a project can use the public interface directly. For example, calling `describe` in specs instead of `jasmine.getEnv().describe`.
       */
      ax.object.extend(window, jasmineInterface);

      /**
       * ## Runner Parameters
       *
       * More browser specific code - wrap the query string in an object and to allow for getting/setting parameters from the runner user interface.
       */

      var queryString = new jasmine.QueryString({
         getWindowLocation: function() { return window.location; }
      });

      var catchingExceptions = queryString.getParam('catch');
      env.catchExceptions(typeof catchingExceptions === 'undefined' ? true : catchingExceptions);

      var throwingExpectationFailures = queryString.getParam('throwFailures');
      env.throwOnExpectationFailure(throwingExpectationFailures);

      /**
       * ## Reporters
       * The `HtmlReporter` builds all of the HTML UI for the runner page. This reporter paints the dots, stars, and x's for specs, as well as all spec names and all failures (if any).
       */
      var htmlReporter = new jasmine.HtmlReporter({
         env: env,
         onRaiseExceptionsClick: function() { queryString.navigateWithNewParam('catch', !env.catchingExceptions()); },
         onThrowExpectationsClick: function() { queryString.navigateWithNewParam('throwFailures', !env.throwingExpectationFailures()); },
         addToExistingQueryString: function(key, value) { return queryString.fullStringWithNewParam(key, value); },
         getContainer: function() { return document.body; },
         createElement: function() { return document.createElement.apply(document, arguments); },
         createTextNode: function() { return document.createTextNode.apply(document, arguments); },
         timer: new jasmine.Timer()
      });

      /**
       * The `jsApiReporter` also receives spec results, and is used by any environment that needs to extract the results  from JavaScript.
       */
      env.addReporter(jasmineInterface.jsApiReporter);
      env.addReporter(htmlReporter);

      /**
       * Filter which specs will be run by matching the start of the full name against the `spec` query param.
       */
      var specFilter = new jasmine.HtmlSpecFilter({
         filterString: function() { return queryString.getParam('spec'); }
      });

      env.specFilter = function(spec) {
         return specFilter.matches(spec.getFullName());
      };

      /**
       * Setting up timing functions to be able to be overridden. Certain browsers (Safari, IE 8, phantomjs) require this hack.
       */
      window.setTimeout = window.setTimeout;
      window.setInterval = window.setInterval;
      window.clearTimeout = window.clearTimeout;
      window.clearInterval = window.clearInterval;

      htmlReporter.initialize();

      return createRunner( env );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createRunner( jasmineEnv ) {
      return {
         run: function() {
            jasmineEnv.execute();
         },
         env: jasmineEnv
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      create: create
   };

} );

/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 *
 * with parts by Kris Kowal
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 */
/**
 * A testing framework for LaxarJS widgets.
 *
 * @module laxar-mocks
 */
define( 'laxar-mocks/laxar-mocks',[
   'require',
   'laxar',
   './lib/helpers',
   './lib/widget_spec_initializer',
   './lib/jasmine_boot',
   'promise-polyfill'
], function( require, ax, helpers, widgetSpecInitializer, jasmineBoot ) {
   'use strict';

   if( Promise._setImmediateFn ) {
      // If this is truthy, the Promise polyfill was loaded instead of a native implementation.
      configurePromisePolyfill();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * The API to instrument and inspect the widget under test. In addition to the listed methods it has all
    * injections for the specific widget technology set as properties. E.g. for every widget technology there
    * will be `axEventBus` and `axContext` properties, but for AngularJS widgets there will be an additional
    * `$scope` property. Note that these are only available after `load()` has been called and the widget
    * controller is loaded.
    *
    * The methods of the event bus instance available as `axEventBus` are already provided with
    * [Jasmine spies](http://jasmine.github.io/2.3/introduction.html#section-Spies).
    *
    * @name Widget
    */
   var widget = {

      /**
       * Configures the widget features before loading with the given configuration object or key/value
       * entries. In fact this is what you'd normally configure under the `features` key in a page descriptor.
       *
       * Shorthands may be used:
       *
       * This
       * ```js
       * beforeEach( function() {
       *    testing.widget.configure( {
       *       search: {
       *          resource: 'search'
       *       }
       *    } );
       * } );
       * ```
       * is equivalent to the following shorter version
       * ```js
       * beforeEach( function() {
       *    testing.widget.configure( 'search.resource', 'search' );
       * } );
       * ```
       *
       * @param {String|Object} keyOrConfiguration
       *    either an object for the full features configuration or the path to the property to configure
       * @param {*} [optionalValue]
       *    if `keyOrConfiguration` is a string, this is the value to set the feature configuration to
       *
       * @memberOf Widget
       */
      configure: function( keyOrConfiguration, optionalValue ) {
         if( !widgetPrivateApi.configure ) {
            throw new Error( 'testing.createSetupForWidget needs to be called prior to configure.' );
         }

         widgetPrivateApi.configure.apply( widgetPrivateApi, arguments );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Loads the given widget and instantiates its controller. As this function is asynchronous, it receives
       * a Jasmine `done` callback, that is called when the widget is ready.
       *
       * The simplest way to call this function is by passing it to its own `beforeEach` call:
       * ```js
       * beforeEach( testing.widget.load );
       * ```
       *
       * @param {Function} done
       *    callback to notify Jasmine, that the asynchronous widget loading has finished
       *
       * @memberOf Widget
       */
      load: function( done ) {
         if( !widgetPrivateApi.load ) {
            throw new Error( 'testing.createSetupForWidget needs to be called prior to load.' );
         }

         if( typeof done !== 'function' ) {
            throw new Error( 'testing.widget.load needs to be called with a Jasmine done-callback function.' );
         }

         widgetPrivateApi.load()
            .catch( handleErrorForJasmine )
            .then( done );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Renders the widget's template by calling the appropriate widget adapter and appends it within a
       * container div to the test's DOM. The widget DOM fragement will be returned in order to simulate
       * user interaction on it. Calling `testing.tearDown()` will remove it again.
       *
       * Note that calling this method for an activity has no effect and hence is unnessecary.
       *
       * @return {Node}
       *    the widget DOM fragment
       *
       * @memberOf Widget
       */
      render: function() {
         if( widgetDomContainer && widgetDomContainer.parentElement ) {
            widgetDomContainer.parentElement.removeChild( widgetDomContainer );
         }

         widgetDomContainer = document.createElement( 'div' );
         widgetDomContainer.id = 'widgetContainer';
         document.body.appendChild( widgetDomContainer );
         widgetPrivateApi.renderTo( widgetDomContainer );

         return widgetDomContainer.firstChild;
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var axMocks = {

      createSetupForWidget: createSetupForWidget,

      /**
       * The {@link Widget} instrumentation instance for this test.
       * After the setup-method (provided by {@link createSetupForWidget}) has been run, this also contains
       * the widget's injections.
       *
       * @type {Widget}
       * @name widget
       */
      widget: widget,

      /**
       * This method is used by the spec-runner (HTML- or karma-based) to start running the spec suite.
       */
      runSpec: null,

      /**
       * The _"test end"_ of the LaxarJS event bus.
       * Tests should use this event bus instance to interact with the widget under test by publishing
       * synthetic events. Tests can also use this handle for subscribing to events published  by the widget.
       *
       * There is also the event bus instance used by the widget itself, with spied-upon publish/subscribe
       * methods. That instance can be accessed as `axMocks.widget.axEventBus`.
       *
       * @name eventBus
       */
      eventBus: null,

      tearDown: tearDown,
      triggerStartupEvents: triggerStartupEvents,
      configureMockDebounce: configureMockDebounce
   };

   var widgetDomContainer;
   var widgetPrivateApi = {};
   var path = ax._tooling.path;

   ax._tooling.eventBus.init( helpers.legacyQ(), eventBusTick, eventBusTick );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var jasmineRunner;
   var specContextLoaded = new Promise( function( resolve, reject ) {
      axMocks.runSpec = function( specConf, jasmineEnv ) {
         if( specConf.title ) {
            document.title = specConf.title;
         }

         var specUrl = specConf.specUrl || dirname( window.location.href );
         var specBase = path.relative( require.toUrl( './' ), specUrl );
         var specPrefix = specBase[0] === '.' ? '' : './';

         var tests = specConf.tests.map( function( test ) {
            return specPrefix + path.join( specBase, test );
         } );

         jasmineRunner = jasmineBoot.create( jasmineEnv || null );

         // For AngularJS widgets to work, we need to load angular-mocks at this stage. This is because it
         // checks for the presence of jasmine and if found, adds a beforeEach block. If we would load it
         // later, beforeEach blocks would already have been called and AngularJS modules would not have been
         // loaded.
         helpers.require( [ 'angular-mocks' ] )
            .then( helpers.require.bind( null, tests, require ) )
            .then( function() {
               resolve( {
                  jasmineEnv: jasmineRunner.env,
                  absSpecLocation: specUrl
               } );
               jasmineRunner.run();
            } )
            .catch( function( err ) {
               if( window.console && window.console.error ) {
                  window.console.error( err );
               }

               reject( err );
               jasmineRunner.env.beforeEach( function() {
                  jasmineRunner.env.fail( err );
               } );
               jasmineRunner.run();
            } );
      };
   } );



   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates the setup function for a widget test. The returned function is asynchronous and should simply be
    * passed to `beforeEach`. By doing so, the handling of the Jasmine `done` callback happens under the hood.
    * To receive the widget descriptor (i.e. the contents of the `widget.json` file) the use of the RequireJS
    * *json* plugin is advised.
    *
    * Example:
    * ```js
    * define( [
    *    'json!../widget.json',
    *    'laxar-mocks'
    * ], function( descriptor, axMocks ) {
    *    'use strict';
    *
    *    describe( 'An ExampleWidget', function() {
    *
    *       beforeEach( testing.createSetupForWidget( descriptor ) );
    *
    *       // ... widget configuration, loading and your tests
    *
    *       afterEach( axMocks.tearDown );
    *
    *    } );
    * } );
    * ```
    *
    * @param {Object} widgetDescriptor
    *    the widget descriptor (taken from `widget.json`)
    * @param {Object} [optionalOptions]
    *    optional map of options
    * @param {Object} optionalOptions.adapter
    *    a technology adapter to use for this widget.
    *    When using a custom integration technology (something other than "plain" or "angular"), pass the
    *    adapter module using this option.
    * @param {Array} optionalOptions.knownMissingResources
    *    list of file name parts as strings or regular expressions, that are known to be absent and as such
    *    won't be found by the file resource provider and thus result in the logging of a 404 HTTP error.
    *    So whenever such an error is logged and the absence of the file is fine, an appropriate entry can be
    *    added to this configuration. Mostly CSS files are affected by this
    *
    * @return {Function}
    *    a function to directly pass to `beforeEach`, accepting a Jasmine `done` callback
    */
   function createSetupForWidget( widgetDescriptor, optionalOptions ) {

      var options = ax.object.options( optionalOptions, {
         adapter: null,
         knownMissingResources: []
      } );

      if( options.adapter ) {
         ax._tooling.widgetAdapters.addAdapters( [ options.adapter ] );
      }

      var adapterFactory = ax._tooling.widgetAdapters.getFor( widgetDescriptor.integration.technology );
      var applyViewChanges = adapterFactory.applyViewChanges ? adapterFactory.applyViewChanges : function() {};

      return function( done ) {
         axMocks.eventBus = ax._tooling.eventBus.create();
         axMocks.eventBus.flush = function() {
            flushEventBusTicks( applyViewChanges );
         };
         specContextLoaded
            .then( function( specContext ) {
               specContext.eventBusTick = eventBusTick;
               specContext.eventBus = axMocks.eventBus;
               specContext.options = options;
               return widgetSpecInitializer
                  .createSetupForWidget( specContext, axMocks.widget, widgetPrivateApi, widgetDescriptor );
            } )
            .catch( handleErrorForJasmine )
            .then( done );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Removes any DOM fragments of the widget and calls the appropriate destructors. It is advised to call
    * this once in an `afterEach` call. Passing this function directly to `afterEach` works as well.
    *
    * Example.
    * ```js
    * afterEach( axMocks.tearDown );
    * ```
    */
   function tearDown() {
      widgetPrivateApi.destroy();
      if( widgetDomContainer && widgetDomContainer.parentElement ) {
         widgetDomContainer.parentElement.removeChild( widgetDomContainer );
         widgetDomContainer = null;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var defaultEvents = ( function() {
      var sortIndexCounter = 0;
      return {
         didChangeLocale: {
            AX_SORT_INDEX: sortIndexCounter++,
            'default': {
               locale: 'default',
               languageTag: 'en'
            }
         },
         didChangeTheme: {
            AX_SORT_INDEX: sortIndexCounter++,
            'default': {
               theme: 'default'
            }
         },
         beginLifecycleRequest: {
            AX_SORT_INDEX: sortIndexCounter++,
            'default': {
               lifecycleId: 'default'
            }
         },
         didChangeAreaVisibility: {
            AX_SORT_INDEX: sortIndexCounter++,
            'content.true': {
               area: 'content',
               visible: true
            }
         },
         didNavigate: {
            AX_SORT_INDEX: sortIndexCounter++,
            testing: {
               place: 'testing',
               target: '_self',
               data: {}
            }
         }
      };
   } )();

   /**
    * Triggers all events normally published by the runtime after instantiation of the controller. This
    * includes the following events, listed with their according payloads in the order they are published:
    *
    * **1. didChangeLocale.default:**
    * ```js
    * {
    *    locale: 'default',
    *    languageTag: 'en'
    * }
    * ```
    * **2. didChangeTheme.default:**
    * ```js
    * {
    *    theme: 'default'
    * }
    * ```
    * **3. beginLifecycleRequest.default:**
    * ```js
    * {
    *    lifecycleId: 'default'
    * }
    * ```
    * **4. didChangeAreaVisibility.content.true:**
    * ```js
    * {
    *    area: 'content',
    *    visible: true
    * }
    * ```
    * **5. didNavigate.testing:**
    * ```js
    * {
    *    place: 'testing',
    *    target: '_self',
    *    data: {}
    * }
    * ```
    *
    * Via the `optionalEvents` argument it is possible to add events with different trailing topics, to
    * overwrite events defined above, or to completely prevent from triggering one of the events. To do so
    * simply pass a map, where the primary topics are the keys and the value is a map from trailing topic to
    * payload. If the value is `null`, the specific event is not published.
    *
    * Example:
    * ```js
    * axMocks.triggerStartupEvents( {
    *    didChangeLocale: {
    *       alternative: {
    *          locale: 'alternative',
    *          languageTag: 'de'
    *       }
    *    },
    *    didChangeTheme: {
    *       'default': null
    *    },
    *    didNavigate: {
    *       testing: {
    *          place: 'testing',
    *          target: '_self',
    *          data: {
    *             user: 'Peter',
    *             articleId: '1234'
    *          }
    *       }
    *    }
    * } );
    * ```
    *
    * The effect of this call is the following:
    * 1. There will be two *didChangeLocale* events: *didChangeLocale.default*, carrying the language tag *en*
    *    in its payload, and *didChangeLocale.alternative*, carrying the language tag *de* in its payload.
    * 2. There will be no *didChangeTheme* event, since the only pre-configured one is set to `null`.
    * 3. The parameters of the *didNavigate.testing* event are changed to be
    *    `{ user: 'Peter', articleId: '1234' }`.
    *
    * @param {Object} [optionalEvents]
    *    optional map of user defined events
    *
    */
   function triggerStartupEvents( optionalEvents ) {
      var userEvents = optionalEvents || {};
      Object.keys( defaultEvents )
         .sort( function( eventNameA, eventNameB ) {
            return defaultEvents[ eventNameA ].AX_SORT_INDEX - defaultEvents[ eventNameB ].AX_SORT_INDEX;
         } )
         .map( function( primaryTopic ) {
            var userEventInfo = userEvents[ primaryTopic ] || {};
            var eventInfo = ax.object.extend( {}, defaultEvents[ primaryTopic ], userEventInfo );
            delete eventInfo.AX_SORT_INDEX;
            return {
               primaryTopic: primaryTopic,
               subtopics: eventInfo
            };
         } )
         .forEach( function( event ) {
            Object.keys( event.subtopics )
               .forEach( function( topicRemainder ) {
                  var payload = event.subtopics[ topicRemainder ];
                  if( payload ) {
                     axMocks.eventBus.publish( event.primaryTopic + '.' + topicRemainder, payload );
                  }
               } );
            axMocks.eventBus.flush();
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Installs an `laxar.fn.debounce`-compatible mock replacement that supports manual `flush()`.
    * When called, `flush` will process all pending debounced calls,
    * Additionally, there is a `debounce.waiting` array, to inspect waiting calls.
    *
    * When called from a `beforeEach` block, only a manual flush will cause debounced calls to be processed
    * within that block. The passing of time (wall-clock or jasmine-mock clock) will have no effect on calls
    * that were debounced in this context.
    *
    * The mocks are automatically cleaned up after each test case.
    */
   function configureMockDebounce() {
      var fn = ax.fn;
      spyOn( fn, 'debounce' ).and.callThrough();
      fn.debounce.flush = flush;
      fn.debounce.waiting = [];

      var timeoutId = 0;
      spyOn( fn, '_setTimeout' ).and.callFake( function( f, interval ) {
         var timeout = ++timeoutId;
         var run = function( force ) {
            if( timeout === null ) { return; }
            removeWaiting( timeout );
            timeout = null;
            f( force );
         };

         fn.debounce.waiting.push( run );
         run.timeout = timeout;
         return timeout;
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function flush() {
         fn.debounce.waiting.forEach( function( run ) {
            run( true );
         } );
         fn.debounce.waiting.splice( 0 );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function removeWaiting( timeout ) {
         fn.debounce.waiting = fn.debounce.waiting.filter( function( waiting ) {
            return waiting.timeout !== timeout;
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function dirname( file ) {
      return file.substr( 0, file.lastIndexOf( '/' ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var scheduledFunctions = [];
   function eventBusTick( func ) {
      scheduledFunctions.push( func );
   }

   function flushEventBusTicks( applyViewChanges ) {
      while( scheduledFunctions.length > 0 ) {
         var funcs = scheduledFunctions.slice( 0 );
         scheduledFunctions = [];
         funcs.forEach( function( func ) { func(); } );
         applyViewChanges();
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function handleErrorForJasmine( err ) {
      if( window.console && window.console.error ) {
         window.console.error( err );
      }
      jasmine.getEnv().fail( err );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function configurePromisePolyfill() {
      // First search for fast alternatives to internal tick of native Promise
      if( typeof window.setImmediate === 'function' ) {
         Promise._setImmediateFn( window.setImmediate );
      }
      else if( typeof MessageChannel !== 'undefined' ) {
         // Taken from Q:
         // https://github.com/kriskowal/q/blob/0428c15d2ffc8e874b4be3a50e92884ef8701a6f/q.js#L125-141
         // Copyright 2009-2012 Kris Kowal under the terms of the MIT
         var channel = new MessageChannel();
         // linked list of tasks (single, with head node)
         var head = {}, tail = head;
         channel.port1.onmessage = function () {
            var next = head.next;
            var task = next.task;
            head = next; task();
         };

         Promise._setImmediateFn( function (task) {
            tail = tail.next = {task: task};
            channel.port2.postMessage();
         } );
      }
      else {
         // If nothing else helps:
         // get a mock free reference to setTimeout before someone mocks it on the window object
         var windowSetTimeout = window.setTimeout;
         Promise._setImmediateFn( function( callback ) {
            windowSetTimeout( callback, 0 );
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return axMocks;

} );

define('laxar-mocks', ['laxar-mocks/laxar-mocks'], function (main) { return main; });

