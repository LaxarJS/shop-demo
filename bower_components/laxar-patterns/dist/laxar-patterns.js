/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *takeActionRequest*, *willTakeAction* and
 * *didTakeAction* events.
 *
 * @module actions
 */
define( 'laxar-patterns/lib/actions',[
   'angular',
   'laxar'
], function( ng, ax ) {
   'use strict';

   var $q;
   ng.injector( [ 'ng' ] ).invoke( [ '$q', function( _$q_ ) {
      $q = _$q_;
   } ] );

   var NOOP = function() {};
   var DELIVER_TO_SENDER = { deliverToSender: false };

   var OUTCOME_SUCCESS = 'SUCCESS';
   var OUTCOME_ERROR = 'ERROR';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish `takeActionRequest` events for a given action feature. The
    * action to publish is expected to be at the key `action` under the given feature path.
    *
    * Apart from that this function works just like {@link publisher}.
    *
    * @param {Object} scope
    *    the scope the publisher works on. Needs at least an EventBus instance as `eventBus` property
    * @param {String} feature
    *    the feature to take the action name from
    * @param {Object} [optionalOptions]
    *    options for the publisher
    * @param {Boolean} optionalOptions.deliverToSender
    *    the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be
    *    delivered to the publisher. Default is `false`
    * @param {Function} optionalOptions.onSuccess
    *    a function that is called when the overall outcome yields "SUCCESS"
    * @param {Function} optionalOptions.onError
    *    a function that is called when the overall outcome yields "ERROR"
    * @param {Function} optionalOptions.onComplete
    *    a function that is called always, independently of the overall outcome
    *
    * @returns {Function}
    *    the publisher as described above
    */
   function publisherForFeature( scope, feature, optionalOptions ) {
      var action = ax.object.path( scope.features, feature + '.action', null );
      return publisher( scope, action, optionalOptions );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish `takeActionRequest` events for a given action. The outcomes of
    * all given `didTakeAction` events are interpreted and optional callbacks according to the overall outcome
    * are called. Interpretation is simple: If at least one `didTakeAction` event yields the outcome "ERROR",
    * the overall outcome is also erroneous. In any other case the overall outcome will be successful.
    *
    * The promise returned by the publisher is resolved, if the overall outcome is successful and rejected if
    * the outcome is erroneous. All callbacks, be it the `on*` handlers or the then handlers of the promise,
    * will receive the list of events and meta information of all `didTakeAction` events
    * (see `EventBus#publishAndGatherReplies()` for details).
    *
    * Example:
    * ```js
    * publisher = actions.publisher( scope, 'save', {
    *    onSuccess: function() { closeApplication(); },
    *    onError: function() { displayError(); }
    * } );
    *
    * $button.on( 'click', publisher );
    * ```
    *
    * @param {Object} scope
    *    the scope the publisher works on. Needs at least an EventBus instance as `eventBus` property
    * @param {String} action
    *    the action to publish on call of the publisher
    * @param {Object} [optionalOptions]
    *    options for the publisher
    * @param {Boolean} optionalOptions.deliverToSender
    *    the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be
    *    delivered to the publisher. Default is `false`
    * @param {Function} optionalOptions.onSuccess
    *    a function that is called when the overall outcome yields "SUCCESS"
    * @param {Function} optionalOptions.onError
    *    a function that is called when the overall outcome yields "ERROR"
    * @param {Function} optionalOptions.onComplete
    *    a function that is called always, independently of the overall outcome
    *
    * @returns {Function}
    *    the publisher as described above
    */
   function publisher( scope, action, optionalOptions ) {
      ax.assert( scope ).hasType( Object ).hasProperty( 'eventBus' );
      ax.assert( action ).hasType( String ).isNotNull();

      var options = ax.object.options( optionalOptions, {
         deliverToSender: false,
         onSuccess: NOOP,
         onError: NOOP,
         onComplete: NOOP
      } );

      ax.assert( options.onSuccess ).hasType( Function ).isNotNull();
      ax.assert( options.onError ).hasType( Function ).isNotNull();
      ax.assert( options.onComplete ).hasType( Function ).isNotNull();

      var eventBusOptions = {
         deliverToSender: options.deliverToSender
      };
      if( options.timeout > 0 ) {
         eventBusOptions.pendingDidTimeout = options.timeout;
      }

      return function( optionalEvent ) {
         var event = ax.object.options( optionalEvent, {
            action: action
         } );

         return scope.eventBus
            .publishAndGatherReplies( 'takeActionRequest.' + action, event, eventBusOptions )
            .then( function( didResponses ) {
               var failed = didResponses.some( function( response ) {
                  return response.event.outcome === OUTCOME_ERROR;
               } );

               options.onComplete( didResponses.slice( 0 ) );

               if( failed ) {
                  options.onError( didResponses.slice( 0 ) );
                  throw didResponses;
               }

               options.onSuccess( didResponses.slice( 0 ) );
               return didResponses;
            } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a new action handler instance for `takeActionRequest` events. It handles sending of an optional
    * `willTakeAction` event and the final, possibly later asynchronously following `didTakeAction` event.
    *
    * @param {Object} scope
    *    the scope the handler should work with. It is expected to find an `eventBus` property there with
    *    which it can do the event handling
    *
    * @return {ActionHandler}
    *    an action handler instance
    */
   function handlerFor( scope ) {
      ax.assert( scope ).hasType( Object ).hasProperty( 'eventBus' );

      return new ActionHandler( scope );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param scope
    *
    * @constructor
    * @private
    */
   function ActionHandler( scope ) {
      this.scope_ = scope;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a handler for `takeActionRequest` events with actions from a feature. It is assumed that the
    * given feature has an `onActions` property, which is a set of actions to listen to. The set may be empty,
    * `null` or `undefined`, in which case the handler simply won't be attached to any event.
    *
    * Apart from that this function works just like {@link ActionHandler#registerActions}.
    *
    * Example:
    * Consider the following configuration for a widget:
    * ```json
    * {
    *    "features": {
    *       "open": {
    *          "onActions": [ "openAction1", "openAction2" ]
    *       },
    *       "save": {
    *          "onActions": [ "save" ]
    *       }
    *    }
    * }
    * ```
    * An example using that would be:
    * ```js
    * actions.handlerFor( scope )
    *    .registerActionsFromFeature( 'open', function( event, meta ) {
    *       somethingSynchronous();
    *       return actions.OUTCOME_SUCCESS;
    *    } )
    *    .registerActionsFromFeature( 'save', function( event, meta ) {
    *       return $q.when( somethingAsynchronous() );
    *    } );
    * ```
    *
    * @param {String} feature
    *    the feature to read the actions to watch from
    * @param {Function} handler
    *    the handler to call whenever a `takeActionRequest` event with matching action is received
    *
    * @return {ActionHandler}
    *    this instance for chaining
    */
   ActionHandler.prototype.registerActionsFromFeature = function( feature, handler ) {
      var actions = ax.object.path( this.scope_.features, feature + '.onActions' ) || [];
      return this.registerActions( actions, handler );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a handler for `takeActionRequest` events for a set of actions. The set may be empty, in
    * which case the handler simply won't be attached to any event.
    *
    * The handler is assumed to be a function that receives the event and meta object of the underlying
    * `takeActionRequest` event when called. In order to send the correct `didTakeAction` event as response,
    * the return value of the handler is interpreted according to the following rules:
    *
    * - the handler throws an error
    *   - the `didTakeAction` event is sent with outcome `ERROR`
    *   - the error is re-thrown
    * - the handler returns a simple value or a promise, that is later resolved with a value
    *   - if the value is a plain object, it is used as basis for the event object and
    *     - if the object has a property `outcome` with value `ERROR`, the `didTakeAction` event is sent with
    *       outcome `ERROR`
    *   - otherwise, or if the value is no plain object, the `didTakeAction` event is sent with outcome
    *     `SUCCESS`
    * - the handler returns a promise, that is later rejected with a value
    *   - if the value is a plain object, it is used as basis for the event object and
    *     - if the object has a property `outcome` with value `SUCCESS`, the `didTakeAction` event is sent with
    *     outcome `SUCCESS`
    *   - otherwise, or if the value is no plain object, the `didTakeAction` event is sent with outcome `ERROR`
    *
    * So basically simple return values or resolved promises are assumed to be successful if they don't state
    * otherwise, while rejected promises are assumed to be erroneous, if they don't state otherwise.
    *
    * Example:
    * ```js
    * actions.handlerFor( scope )
    *    .registerActions( [ 'open' ], function( event, meta ) {
    *       return 42
    *    } )
    *    .registerActions( [ 'save' ], function( event, meta ) {
    *       return $q.when( { resultValue: 42 } );
    *    } );
    * ```
    *
    * @param {String[]} actions
    *    a set of actions to watch
    * @param {Function} handler
    *    the handler to call whenever a `takeActionRequest` event with matching action is received
    *
    * @return {ActionHandler}
    *    this instance for chaining
    */
   ActionHandler.prototype.registerActions = function( actions, handler ) {
      ax.assert( actions ).hasType( Array ).isNotNull();
      ax.assert( handler ).hasType( Function ).isNotNull();

      var self = this;
      actions.forEach( function( action ) {
         self.scope_.eventBus.subscribe( 'takeActionRequest.' + action, function( event, meta ) {
            callHandler( self.scope_.eventBus, action, handler, event, meta );
         } );
      } );

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function callHandler( eventBus, action, handler, event, meta ) {
      eventBus.publish( 'willTakeAction.' + action, {
         action: action
      }, DELIVER_TO_SENDER );

      var responseEvent = {
         action: action,
         outcome: OUTCOME_SUCCESS
      };

      var returnValue;
      try {
         returnValue = handler( event, meta );
      }
      catch( error ) {
         responseEvent.outcome = OUTCOME_ERROR;

         eventBus.publish( 'didTakeAction.' + action + '.' + OUTCOME_ERROR, responseEvent, DELIVER_TO_SENDER );
         throw error;
      }

      $q.when( returnValue )
         .then( function( promiseValue ) {
            if( ng.isObject( promiseValue ) ) {
               responseEvent.outcome =
                  promiseValue.outcome === OUTCOME_ERROR ? OUTCOME_ERROR : OUTCOME_SUCCESS;
            }

            return promiseValue;
         }, function( promiseValue ) {
            responseEvent.outcome = OUTCOME_ERROR;
            if( ng.isObject( promiseValue ) ) {
               responseEvent.outcome =
                  promiseValue.outcome === OUTCOME_SUCCESS ? OUTCOME_SUCCESS : OUTCOME_ERROR;
            }

            return promiseValue;
         } )
         .then( function( promiseValue ) {
            responseEvent = ax.object.options( responseEvent, promiseValue );
            var eventName = 'didTakeAction.' + action + '.' + responseEvent.outcome;
            eventBus.publish( eventName, responseEvent, DELIVER_TO_SENDER );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      publisher: publisher,
      publisherForFeature: publisherForFeature,
      handlerFor: handlerFor,
      OUTCOME_ERROR: OUTCOME_ERROR,
      OUTCOME_SUCCESS: OUTCOME_SUCCESS
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didEncounterError* events.
 *
 * @module errors
 */
define( 'laxar-patterns/lib/errors',[ 'laxar' ], function( ax ) {
   'use strict';

   var assert = ax.assert;

   /**
    * Creates and returns a function to publish didEncounterError events related to a specific feature.
    * Generated events will not be delivered to the sender.
    *
    * The returned publisher function takes these arguments:
    * - `code`: a generic code that identifies the failing operation (such as 'HTTP_PUT', 'HTTP_GET')
    * - `messagePath`: to lookup a human-readable message under this publisher's feature configuration
    * - `data`: additional information to be used for substituting in the message, It should contain the
    *   fields `resource` and `location` if applicable.
    * - `cause`: more diagnostic information on the error's cause, such as the underlying HTTP status code
    *
    * @param {Object} scope
    *    the scope the publisher works on
    * @param {String} featurePath
    *    the configuration path for (i18n) error-messages to publish
    * @param {Object} [options]
    *    an optional object with additional configuration
    * @param {Function} options.localizer
    *    a function such as `i18nHandler.localize` to prepare messages
    *
    * @return {Function}
    *    a publisher function with four arguments as described above
    */
   function errorPublisherForFeature( scope, featurePath, options ) {
      assert( scope ).hasType( Object ).isNotNull();
      assert( scope.eventBus ).hasType( Object ).isNotNull();
      assert( options ).hasType( Object );

      var localizer = options && options.localizer;
      assert( localizer ).hasType( Function );

      var featureConfiguration = ax.object.path( scope.features, featurePath );
      assert( featureConfiguration ).hasType( Object ).isNotNull();

      return function( code, messagePath, data, cause ) {
         var rawMessage = ax.object.path( featureConfiguration, messagePath );
         assert( rawMessage ).isNotNull();

         data = data || {};
         scope.eventBus.publish( 'didEncounterError.' + code, {
            code: code,
            message: ax.string.format( localizer ? localizer( rawMessage ) : rawMessage, [], data ),
            data: data,
            cause: cause || {}
         }, { deliverToSender: false } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      errorPublisherForFeature: errorPublisherForFeature
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didChangeFlag* events.
 *
 * @module flags
 */
define( 'laxar-patterns/lib/flags',[
   'laxar'
], function( ax ) {
   'use strict';

   /**
    * Creates a new handler instance for didChangeFlag events, on which one can attach a listener for
    * accumulated flag changes. Assume for example a feature like `disableOn`, which defines a set of flags,
    * where a `true` state of any of the flags disables the widget. The developer shouldn't care about single
    * flag states but should only be notified, if a change of one flag leads to a change of the accumulated
    * "any flag should be true" state.
    *
    * Additionally it is possible to let the handler set the current state of the accumulated flag on a given
    * scope property.
    *
    * @param {Object} scope
    *    the scope the handler should work with. It is expected to find an `eventBus` property there with
    *    which it can do the event handling
    *
    * @returns {FlagHandler}
    *    a flag handler instance
    */
   function handlerFor( scope ) {
      return new FlagHandler( scope );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param scope
    *
    * @constructor
    * @private
    */
   function FlagHandler( scope ) {
      this.scope_ = scope;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a flag or a set of flags from the given feature. In contrast to the `ResourceHandler` here
    * the complete attribute path to the flag(s) must be provided. This is due to the fact that there is no
    * convention on names for flags on a feature, as there can coexist multiple flags for one feature, each
    * influencing a different aspect of this feature.
    *
    * @param {String} featurePath
    *    the attribute path to the configured flag(s) within the feature map
    * @param {Object} [optionalOptions]
    *    options and callbacks to use
    * @param {Boolean} optionalOptions.initialState
    *    the optional initial state of the accumulated state. If not given each non-inverted flag is initially
    *    assumed to be `false` and `true`, if it is inverted
    * @param {Function|Function[]} optionalOptions.onChange
    *    a function or a list of functions to call whenever the accumulated state of the flags changes. It
    *    receives the new state as first argument and its previous state as second argument
    * @param {String} optionalOptions.scopeKey
    *    the key to set the current accumulated state on in the scope. If not given, nothing happens. For
    *    example `flags.myFlag` would set `scope.flags.myFlag` to the currently valid accumulated state
    * @param {String} optionalOptions.predicate
    *    one of these:
    *    - `any`: if any of the flag's states is `true`, the accumulated state is `true. This is the default
    *    - `all`: if all of the flag's states are `true`, the accumulated state is `true`
    *
    * @return {FlagHandler}
    *    this instance for chaining
    */
   FlagHandler.prototype.registerFlagFromFeature = function( featurePath, optionalOptions ) {
      return this.registerFlag( ax.object.path( this.scope_.features, featurePath, [] ), optionalOptions );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a flag or a set of flags given as argument. Even `undefined`, `null` or an empty array
    * are handled gracefully and treated as an empty set of flags, thus never changing their states.
    *
    * The new accumulated state is set on `scope.flags` if that is defined. Otherwise it is set on
    * `scope.model`.
    *
    * @param {String|String[]} possibleFlags
    *    one or a list of flags to watch
    * @param {Object} [optionalOptions]
    *    options and callbacks to use
    * @param {Boolean} optionalOptions.initialState
    *    the optional initial state of the accumulated state. If not given each non-inverted flag is initially
    *    assumed to be `false` and `true`, if it is inverted
    * @param {Function|Function[]} optionalOptions.onChange
    *    a function or a list of functions to call whenever the accumuated state of the flags changes. It
    *    receives the new state as first argument and its previous state as second argument
    * @param {String} optionalOptions.scopeKey
    *    the key to set the current accumulated state on in the scope. If not given, nothing happens. For
    *    example `flags.myFlag` would set `scope.flags.myFlag` to the currently valid accumulated state
    * @param {String} optionalOptions.predicate
    *    one of these:
    *    - `any`: if any of the flag's sates is `true`, the accumulated state is `true. This is the default
    *    - `all`: if all of the flag's states are `true`, the accumulated state is `true`
    *
    * @return {FlagHandler}
    *    this instance for chaining
    */
   FlagHandler.prototype.registerFlag = function( possibleFlags, optionalOptions ) {

      optionalOptions = ax.object.options( optionalOptions, {
         predicate: 'any'
      } );

      var applyToScope = function(){};
      if( 'scopeKey' in optionalOptions ) {
         applyToScope = function( state ) {
            ax.object.setPath( this.scope_, optionalOptions.scopeKey, state );
         }.bind( this );
      }

      var flags = processFlags( possibleFlags );
      var changeHandler = processChangeHandlers( optionalOptions.onChange );
      var oldState = ( typeof optionalOptions.initialState === 'boolean' ) ?
         optionalOptions.initialState : evaluateState( flags, optionalOptions.predicate );

      applyToScope( oldState );

      flags.forEach( function( flag ) {
         this.scope_.eventBus.subscribe( 'didChangeFlag.' + flag.name, function( event ) {
            flag.state = flag.negated ? !event.state : event.state;

            var newState = evaluateState( flags, optionalOptions.predicate );
            if( newState !== oldState ) {
               applyToScope( newState );
               changeHandler( newState, oldState );
               oldState = newState;
            }
         }.bind( this ) );
      }.bind( this ) );

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processFlags( flags ) {
      if( !flags ) {
         return [];
      }

      var flagArr = Array.isArray( flags ) ? flags : [ flags ];
      return flagArr.map( function( flagExpression ) {
         var negated = flagExpression.indexOf( '!' ) === 0;
         return {
            name: negated ? flagExpression.substr( 1 ) : flagExpression,
            negated: negated,
            state: negated // always the state after applying a possible negation
         };
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processChangeHandlers( handlers ) {
      if( !handlers ) {
         return function() {};
      }

      var handlerArr = Array.isArray( handlers ) ? handlers : [ handlers ];
      return function( newValue, oldValue ) {
         handlerArr.forEach( function( handler ) {
            handler( newValue, oldValue );
         } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function evaluateState( flags, predicate ) {
      var state = flags.reduce( evaluators[ predicate ], null );
      return state === null ? false : state;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var evaluators = {

      any: function( previousValue, flag ) {
         return previousValue === null ? flag.state : flag.state || previousValue;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      all: function( previousValue, flag ) {
         return previousValue === null ? flag.state : flag.state && previousValue;
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      handlerFor: handlerFor
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didChangeLocale* events.
 *
 * @module i18n
 */
define( 'laxar-patterns/lib/i18n',[
   'laxar'
], function( ax ) {
   'use strict';

   /**
    * Obtain a handler which applies didChangeLocale-events to the given scope.
    *
    * @param {Object} scope
    *    the scope instance for which i18n-state should be managed
    * @param {String} [optionalI18nPath]
    *    an optional path within the scope (default: `'i18n'`) where to store i18n-state
    *
    * @return {I18nHandler}
    *    a handler which manages the i18n-object on the scope, and which allows to register for locale
    *    changes, by topic or by feature
    */
   function handlerFor( scope, optionalI18nPath ) {
      var i18nPath = optionalI18nPath || 'i18n';
      prepareScopeI18n();

      var callbacksByLocale = {};

      function handleLocaleChangeEvent( event ) {
         var locale = event.locale;
         var tags = ax.object.path( scope, i18nPath ).tags;
         var previousTag = tags[ locale ];
         if( previousTag !== event.languageTag ) {
            tags[ locale ] = event.languageTag;
            callbacksByLocale[ locale ].forEach( function( cb ) {
               cb( event, previousTag );
            } );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       *
       * @name I18nHandler
       * @constructor
       * @private
       */
      var handler = {

         /**
          * Manage changes to the given locale(s).
          *
          * @param {String|String[]} possibleLocales
          *    zero, one or more locale topics to manage
          * @param {Object} [optionalOptions]
          *    an optional configuration object
          * @param {Function|Function[]} optionalOptions.onChange
          *    a function or a list of functions to call whenever one of the locales changes
          *    It receives the event which triggered the change as the first argument, and the previous
          *    language-tag as the second argument
          *
          * @return {Object}
          *    this instance for chaining
          *
          * @memberOf I18nHandler
          */
         registerLocale: function( possibleLocales, optionalOptions ) {
            var locales = possibleLocales;
            if( !Array.isArray( possibleLocales ) ) {
               locales = possibleLocales ? [ possibleLocales ] : [];
            }
            locales.forEach( function( locale ) {
               if( !callbacksByLocale[ locale ] ) {
                  callbacksByLocale[ locale ] = [];
                  scope.eventBus.subscribe( 'didChangeLocale.' + locale, handleLocaleChangeEvent );
               }
               var onChange = ( optionalOptions || {} ).onChange;
               if( onChange ) {
                  callbacksByLocale[ locale ] = callbacksByLocale[ locale ].concat(
                     Array.isArray( onChange ) ? onChange : [ onChange ]
                  );
               }

            } );
            return handler;
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Look for the given feature path within the feature configuration and register for changes to the
          * corresponding locale. If there is a key 'locale' at the given feature, that entry is used.
          * Otherwise, the entire configuration path has to be specified.
          *
          * @param {String} featurePath  A feature path for the current scope.
          * @param {Object} [optionalOptions]  An optional configuration object.
          *
          * @return {Object}
          *    this instance for chaining
          *
          * @memberOf I18nHandler
          */
         registerLocaleFromFeature: function( featurePath, optionalOptions ) {
            var entry = ax.object.path( scope.features, featurePath );
            return handler.registerLocale( entry.locale || entry, optionalOptions || {} );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         scopeLocaleFromFeature: function( featurePath, options ) {
            var entry = ax.object.path( scope.features, featurePath );
            scope.i18n.locale = entry.locale || entry;
            return handler.registerLocale( scope.i18n.locale, options || {} );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         localizer: function( fallback ) {
            var model = ax.object.path( scope, i18nPath );
            function partial( i18nValue ) {
               if( typeof i18nValue === 'string' ) { return i18nValue; }
               var tag = model.tags[ model.locale ];
               return tag ? ax.i18n.localizer( tag, fallback )( i18nValue ) : fallback;
            }
            partial.format = function( i18nValue, substitutions ) {
               var i18nLocalizer = ax.i18n.localizer( model.tags[ model.locale ] );
               return i18nLocalizer.format.apply( i18nLocalizer, arguments );
            };
            return partial;
         }

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function prepareScopeI18n() {
         var result = ax.object.path( scope, i18nPath );
         if( !result ) {
            result = {};
            ax.object.setPath( scope, i18nPath, result );
         }
         if( !result.tags ) {
            result.tags = {};
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return handler;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      handlerFor: handlerFor
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for dealing with patches for JSON structures, specifically regarding
 * [RFC 6901](https://tools.ietf.org/html/rfc6901) and [RFC 6902](https://tools.ietf.org/html/rfc6902).
 *
 * @module json
 */
define( 'laxar-patterns/lib/json',[
   'laxar',
   'json-patch'
], function( ax, jsonPatch, undefined ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Lookup a nested object using an rfc-6901 JSON pointer.
    *
    * @param {Object|Array=} object
    *    the object in which to lookup an entry
    * @param {String} pointer
    *    a valid JSON pointer conforming to rfc-6901
    * @param {*} fallback
    *    a value to return if the JSON pointer does not point to any value within the object
    *
    * @return {*}
    *    the value found at the JSON pointer, or the fallback value
    */
   function getPointer( object, pointer, fallback ) {
      var keys = pointer.split( '/' );
      var len = keys.length;
      var usesEscapes = pointer.indexOf( '~' ) !== -1;

      for( var i = 1; i < len; ++i ) {
         if( object === undefined ) {
            return fallback;
         }
         if( Array.isArray( object ) ) {
            var index = parseInt( keys[ i ], 10 );
            object = object[ index ];
         }
         else {
            var key = keys[ i ];
            if( usesEscapes ) {
               // unescape masked chars ('/', '~'):
               key = key.replace( /~1/g, '/' ).replace( /~0/g, '~' );
            }
            object = object[ key ];
         }
      }
      return object === undefined ? fallback : object;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Set a nested item within a structure using an rfc-6901 JSON pointer. Missing containers along the path
    * will be created (using ax.object.path). The object is modified in-place.
    *
    * JSON pointer segments of the type '/-' (for appending to an array) are not supported. You can use a
    * single JSON patch 'add' operation to achieve the desired effect.
    *
    * @param {Object|Array} object
    *    the object in which to lookup an entry
    * @param {String} pointer
    *    a valid JSON pointer conforming to rfc-6901
    * @param {*} value
    *    the value to set at the place indicated by the pointer
    *
    * @return {Object|Array}
    *    the modified object (for chaining)
    */
   function setPointer( object, pointer, value ) {
      var path = pointerToPath( pointer );
      return ax.object.setPath( object, path, value );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Transform an rfc-6901 JSON pointer into a laxar object path.
    *
    * @param {String} pointer
    *    a valid JSON pointer conforming to rfc-6901
    *
    * @return {String}
    *    a path that can be used with ax.object.path
    */
   function pointerToPath( pointer ) {
      var keys = pointer.split( '/' ).slice( 1 );
      if( pointer.indexOf( '~' ) !== -1 ) {
         var len = keys.length;
         for( var i = 0; i < len; ++i ) {
            keys[ i ] = keys[ i ].replace( /~1/g, '/' ).replace( /~0/g, '~' );
         }
      }
      return keys.join( '.' );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Transform a laxar object path into an rfc-6901 JSON pointer.
    *
    * @param {String} path
    *    a LaxarJS object path where segments are separated using '.'
    *
    * @return {String}
    *    a valid JSON pointer conforming to rfc-6901
    */
   function pathToPointer( path ) {
      if( path === '' ) {
         return '';
      }
      var keys = path.split( '.' );
      if( path.indexOf( '/' ) !== -1 || path.indexOf( '~' ) !== -1 ) {
         var len = keys.length;
         for( var i = 0; i < len; ++i ) {
            keys[ i ] = keys[ i ].replace( /~/g, '~0' ).replace( /\//g, '~1' );
         }
      }
      return '/' + keys.join( '/' );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Calls fast-json-patch to apply the given rfc-6902 JSON patch sequence in-place. If the patch sequence
    * fails to apply, the behavior is undefined.
    *
    * @param {Object|Array} object
    *    the object to patch (in-place)
    * @param {Array} patches
    *    a sequence of patches as defined by rfc-6902
    */
   function applyPatch( object, patches ) {
      jsonPatch.apply( object, patches );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Calls fast-json-patch to create a rfc-6902 conform JSON patch sequence.
    *
    * @param {Object|Array} objectA
    *    the first item for comparison
    * @param {Object|Array} objectB
    *    the second item for comparison
    *
    * @return {Array}
    *    a sequence of patches as defined by rfc-6902
    */
   function createPatch( objectA, objectB ) {
      return jsonPatch.compare( objectA, objectB );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      // rfc-6901 helpers
      getPointer: getPointer,
      setPointer: setPointer,
      pointerToPath: pointerToPath,
      pathToPointer: pathToPointer,
      // rfc-6902 helpers
      applyPatch: applyPatch,
      createPatch: createPatch
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Module for old-style LaxarJS patches used with the didUpdate event.
 *
 * @module patches
 */
define( 'laxar-patterns/lib/patches',[
   'laxar'
], function( ax ) {
   'use strict';

   var deepClone = ax.object.deepClone;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Applies all patches given as mapping from object path to new value. If a path fragment doesn't exist
    * it is automatically inserted, using an array if the next key would be an integer. If a value is
    * appended to an array all values in between are set to `null`.
    *
    * @param {Object} obj
    *    the object to apply the patches on
    * @param {Object} patchMap
    *    the mapping of paths to new values
    */
   function apply( obj, patchMap ) {
      if( Array.isArray( patchMap ) ) {
         var arr = patchMap;
         patchMap = {};
         arr.forEach( function( value, key ) {
            if( typeof( value ) !== 'undefined' ) {
               patchMap[ key ] = value;
            }
         } );
      }

      // We sort the keys by length. Thus deeply nested attributes are not overwritten by patches applied to
      // one of their parents.
      Object.keys( patchMap )
         .sort( function( a, b ) { return a.length - b.length; } )
         .forEach( function( path ) {
            ax.object.setPath( obj, path, patchMap[ path ] );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a map of patches that describe the difference between to objects or arrays. Each entry is a
    * path mapped to the changed value. This map can be applied to another object using `applyPatches`.
    *
    * Properties that start with '$$' are ignored when creating patches, so that for example the $$hashCode
    * added by AngularJS ngRepeat is ignored.
    *
    * @param {Object} result
    *    the resulting object the patch map should establish
    * @param {Object} base
    *    the object used to base the patches upon
    *
    * @return {Object}
    *    the mapping of path to patch-value
    */
   function create( result, base ) {
      var targetType = type( result );
      var subjectType = type( base );
      if( targetType !== 'array' && targetType !== 'object' ) {
         return null;
      }

      if( targetType !== subjectType ) {
         return deepClone( result );
      }
      var patches = {};

      function createPatchesRecursively( result, base, path ) {
         var key;
         for( key in result ) {
            if( result.hasOwnProperty( key ) && ( key.charAt( 0 ) !== '$' || key.charAt( 1 ) !== '$' ) ) {
               var val = result[ key ];
               var nextPath = path.concat( key );
               if( base[ key ] == null ) {
                  patches[ nextPath.join( '.' ) ] = clean( deepClone( val ) );
               }
               else {
                  if( val && typeof val === 'object' ) {
                     createPatchesRecursively( val, base[ key ], nextPath );
                  }
                  else if( val !== base[ key ] ) {
                     patches[ nextPath.join( '.' ) ] = val;
                  }
               }
            }
         }

         for( key in base ) {
            if( base.hasOwnProperty( key ) ) {
               if( !( key in result ) ) {
                  patches[ path.concat( key ).join( '.' ) ] = null;
               }
            }
         }
      }
      createPatchesRecursively( result, base, [] );

      return patches;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Merges two patch maps and returns the result. When properties exist in both patch maps, properties
    * within the second map overwrite those found within the first one.
    *
    * @param {Object} first
    *    first map to merge
    * @param {Object} second
    *    second map to merge
    *
    * @return {Object}
    *    the result of the merging
    */
   function merge( first, second ) {
      var resultMap = {};
      var firstKeys = Object.keys( first );
      var secondKeys = Object.keys( second );
      firstKeys.forEach( function( firstKey ) {
         // we first collect all properties in first, that won't be overwritten by changes in the second
         // patch map.
         for( var i = 0; i < secondKeys.length; ++i ) {
            // thus completely matching keys and keys that are finer than one in the second map are ignored
            if( firstKey === secondKeys[ i ] || firstKey.indexOf( secondKeys[ i ] + '.' ) === 0 ) {
               return;
            }
         }

         resultMap[ firstKey ] = first[ firstKey ];
      } );

      secondKeys.forEach( function( secondKey ) {
         // we know only have keys that are absolutely finer than those in the first patch map OR affect a
         // completely different property that should be patched.
         for( var i = 0; i < firstKeys.length; ++i ) {
            var firstKey = firstKeys[ i ];
            var firstKeyAsPathFragment = firstKey + '.';
            if( secondKey.indexOf( firstKeyAsPathFragment ) === 0 ) {
               // here we found a finer change in the second patch map that needs to be merged into the more
               // general change of the first patch map
               var patch = {};
               patch[ secondKey.replace( firstKeyAsPathFragment, '' ) ] = second[ secondKey ];
               var change = first[ firstKey ];
               apply( change, patch );
               resultMap[ firstKey ] = change;

               return;
            }
         }

         resultMap[ secondKey ] = second[ secondKey ];
      } );

      return resultMap;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /** @private */
   function type( object ) {
      if( object === null ) {
         return 'null';
      }
      if( typeof object === 'undefined' ) {
         return 'undefined';
      }

      var tmp = Object.prototype.toString.call( object ).split( ' ' )[1];
      if( !tmp ) {
         return undefined;
      }
      return tmp.substr( 0, tmp.length - 1 ).toLowerCase();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /** @private */
   function clean( object ) {
      if( object === null ) {
         return object;
      }
      for( var key in object ) {
         if( object.hasOwnProperty( key ) ) {
            if( key.charAt( 0 ) === '$' && key.charAt( 1 ) === '$' ) {
               delete object[ key ];
            }
            else if( typeof object[ key ] === 'object' ) {
               clean( object[ key ] );
            }
         }
      }
      return object;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      apply: apply,

      create: create,

      merge: merge

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didReplace* and *didUpdate* events.
 *
 * Definition of the `context` object mentioned throughout this api:
 *
 * In the simplest case this can be the AngularJS `$scope` passed into a widget. Technically this can be
 * any object exposing these three properties:
 * - `eventBus`: The event bus instance used for event subscriptions and publishing events
 * - `features`: The configuration of the widget, used for automagical resource handling
 * - `resources`: An object where all registered resources and updates to them are written to. Will be
 *   added if it doesn't exist.
 *
 * @module resources
 */
define( 'laxar-patterns/lib/resources',[
   'angular',
   'laxar',
   'json-patch',
   './patches'
], function( ng, ax, jsonPatch, patches ) {
   'use strict';

   var assert = ax.assert;
   var $q;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a simple handler function for didReplace events. Replaces will be written to
    * `context.resources` under the given value for `modelKey`.
    *
    * @param {Object} context
    *    the context the handler works on
    * @param {String} modelKey
    *    the property of `context,resources` the handler writes replaces to
    *
    * @return {Function}
    *    the handler function
    */
   function replaceHandler( context, modelKey ) {
      assert( context ).hasType( Object ).isNotNull();
      assert( modelKey ).hasType( String ).isNotNull();

      var resourceBucket = provideResourceBucket( context );
      return function didReplaceHandler( event ) {
         if( resourceBucket[ modelKey ] == null && event.data == null ) {
            return false;
         }

         resourceBucket[ modelKey ] = event.data;
         return true;
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a simple handler function for didUpdate events. Updates will be written to
    * `context.resources` under the given value for `modelKey`.
    *
    * @param {Object} context
    *    the context the handler works on
    * @param {String} modelKey
    *    the property of `context.resources` the handler applies updates to
    *
    * @return {Function}
    *    the handler function
    */
   function updateHandler( context, modelKey ) {
      assert( context ).hasType( Object ).isNotNull();
      assert( modelKey ).hasType( String ).isNotNull();

      var resourceBucket = provideResourceBucket( context );
      return function didUpdateHandler( event ) {
         if( resourceBucket[ modelKey ] != null && Array.isArray( event.patches ) ) {
            jsonPatch.apply( resourceBucket[ modelKey ], event.patches );
            return true;
         }

         return false;
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish didReplace events for the resource found as feature
    * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
    * {@link ResourceHandler#registerResourceFromFeature}. The publisher returns the promise returned by
    * the underlying event bus call.
    *
    * @param {Object} context
    *    the context the publisher works on
    * @param {String} featurePath
    *    the property of `context.features` the publisher reads the resource name from
    * @param {Object} [optionalOptions]
    *    options for the publisher
    * @param {Boolean} optionalOptions.deliverToSender
    *    the value is forwarded to `eventBus.publish`: if `true` the event will also be delivered to the
    *    publisher. Default is `false`
    *
    * @return {Function}
    *    the publisher function. Takes the data to publish as single argument
    */
   function replacePublisherForFeature( context, featurePath, optionalOptions ) {
      assert( context ).hasType( Object ).isNotNull();
      assert( context.eventBus ).hasType( Object ).isNotNull();

      var resourceName = ax.object.path( context.features, featurePath + '.resource' );
      assert( resourceName ).hasType( String ).isNotNull();

      var options = ax.object.options( optionalOptions, {
         deliverToSender: false
      } );

      return function didReplacePublisher( replacement ) {
         return context.eventBus.publish( 'didReplace.' + resourceName, {
            resource: resourceName,
            data: replacement
         }, {
            deliverToSender: !!options.deliverToSender
         } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish didUpdate events for the resource found as feature
    * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
    * {@link ResourceHandler#registerResourceFromFeature}. The publisher returns the promise returned by
    * the underlying event bus call. The returned function only accepts one argument, which is the JSON patch
    * sequence conforming to [RFC 6902](https://tools.ietf.org/html/rfc6902).
    *
    * Example:
    * ```js
    * var publisher = resources.updatePublisherForFeature( context, path );
    * publisher( [
    *    { op: 'remove', path: '/accounts/2' },
    *    { op: 'replace', path: '/contacts/hans/number', value: '+49 123 4563432' }
    * ] );
    * ```
    *
    * Additionally the returned function has a method `compareAndPublish` that accepts the previous version of
    * a resource as first argument and the current version of the resource as second argument. It then creates
    * the JSON patch sequence itself and sends the according didUpdate event. It also returns the promise
    * returned by the underlying event bus call.
    *
    * Example:
    * ```js
    * var publisher = resources.updatePublisherForFeature( context, path );
    * publisher.compareAndPublish( obsoleteVersion, currentVersion );
    * ```
    *
    * Note that a generic generation of patches might lead to strange, large patch sequences, especially when
    * removing entries. The diff library doesn't know about identities and as such won't recognize where a
    * specific element was removed. As a consequence instead of generating a remove operation, this could
    * result in a very large number of replace operations that shift the properties from successors to the
    * front in order to overwrite instead of remove the entry.
    * In such cases one is better off by manually creating a patch with operation remove, as the knowledge
    * about the domain is available at the user of this publisher.
    *
    * @param {Object} context
    *    the context the publisher works on
    * @param {String} featurePath
    *    the property of `context.features` the publisher reads the resource name from
    * @param {Object} [optionalOptions]
    *    options for the publisher
    * @param {Boolean} optionalOptions.deliverToSender
    *    the value is forward to `eventBus.publish`: if `true` the event will also be delivered to the
    *    publisher. Default is `false`
    *
    * @return {Function}
    *    the publisher function as described above
    */
   function updatePublisherForFeature( context, featurePath, optionalOptions ) {
      assert( context ).hasType( Object ).isNotNull();
      assert( context.eventBus ).hasType( Object ).isNotNull();

      var resourceName = ax.object.path( context.features, featurePath + '.resource' );
      assert( resourceName ).hasType( String ).isNotNull();

      var options = ax.object.options( optionalOptions, {
         deliverToSender: false
      } );

      var publisher = function( patches ) {
         assert( patches ).hasType( Array ).isNotNull();

         if( !patches || !patches.length ) {
            ax.log.trace(
               'updatePublisher: Not sending empty didUpdate to resource "[0]" from sender "[1]".',
               resourceName, ( context.widget || { id: 'unknown' } ).id
            );
            $q = $q || ng.injector( [ 'ng' ] ).get( '$q' );
            return $q.when();
         }

         return context.eventBus.publish( 'didUpdate.' + resourceName, {
            resource: resourceName,
            patches: patches
         }, {
            deliverToSender: !!options.deliverToSender
         } );
      };

      publisher.compareAndPublish = function( from, to ) {
         var patches = jsonPatch.compare( from, to );
         return publisher( patches );
      };

      return publisher;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a new handler instance for didReplace and didUpdate events. It already handles setting of the
    * resource data on didReplace in the context.resources property and updating that data on didUpdate events.
    *
    * @param {Object} context
    *    the context the handler should work with. It expects to find an `eventBus` property there with which
    *    it can do the event handling
    *
    * @return {ResourceHandler}
    *    a resource handler instance
    */
   function handlerFor( context ) {
      return new ResourceHandler( context );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param context
    *
    * @constructor
    * @private
    */
   function ResourceHandler( context ) {
      this.context_ = context;
      this.externalHandlers_ = {};
      this.modelHandlers_ = {};
      this.waitingFor_ = [];
      this.allReplacedCallback_ = function() {};
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers default event handlers for a feature. The `feature` argument is interpreted as attribute
    * path to an object having a `resource` property of type string holding the name of the resource to
    * register the handler for. All replacements and updates will be written to `context.resources` by the
    * rules written at `options.modelKey` doc.
    *
    * Example:
    * Consider the following configuration:
    * ```json
    * {
    *    "features": {
    *       "someFeature": {
    *          "someResourceConfig": {
    *             "resource": "myResource"
    *          }
    *       }
    *    }
    * }
    * ```
    * The according call, using an AngularJS Scope as context, would be (providing none of the options):
    * ```js
    * patterns.resources,handlerFor( $scope )
    *    .registerResourceFromFeature( 'someFeature.someResourceConfig' );
    * ```
    *
    * @param {String} featurePath
    *    the attribute path to the feature for the resource
    * @param {Object} [optionalOptions]
    *    options and callbacks to use
    * @param {Function|Function[]} optionalOptions.onReplace
    *    a function or a list of functions to call when a didReplace event is received. Each function
    *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
    *    first the second time a didReplace event occurs
    * @param {Function|Function[]} optionalOptions.onUpdate
    *    a function or a list of functions to call when a didUpdate event is received. Each function
    *    receives the event object as argument
    * @param {Function|Function[]} optionalOptions.onUpdateReplace
    *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
    *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
    *    only called first for didReplace events the second time such an event occurs
    * @param {Boolean} optionalOptions.omitFirstReplace
    *    if `true` `options.onReplace` is only called after the
    *    first time a didReplace event occurred. Default is `false`
    * @param {String} optionalOptions.modelKey
    *    the key to use for the resource in `context.resources`. If not given the last path fragment of
    *    `featurePath` is used. For example if the path is `myfeature.superResource` the key will be
    *    `superResource`
    * @param {Boolean} optionalOptions.isOptional
    *    if set to `true`, missing configuration for this resource is silently ignored and no handlers
    *    are registered. If set to `false`, an error will be raised in this case (default is `false`)
    *
    * @return {ResourceHandler}
    *    this instance for chaining
    */
   ResourceHandler.prototype.registerResourceFromFeature = function( featurePath, optionalOptions ) {
      var resource = ax.object.path( this.context_.features, featurePath + '.resource', null );
      optionalOptions = ax.object.options( optionalOptions, { isOptional: false } );
      if( resource === null && !!optionalOptions.isOptional ) {
         return this;
      }
      assert( resource ).isNotNull( 'Could not find resource configuration in features for "' + featurePath + '"' );

      if( !optionalOptions.modelKey ) {
         optionalOptions.modelKey = featurePath.substr( featurePath.lastIndexOf( '.' ) + 1 );
      }

      return this.registerResource( resource, optionalOptions );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers default event handlers for a known resource name. All replacements and updates will be
    * written to `context.resources`.
    *
    * @param {String} resource
    *    the resource the handler should be registered for
    * @param {Object} [optionalOptions]
    *    options and callbacks to use
    * @param {Function|Function[]} optionalOptions.onReplace
    *    a function or a list of functions to call when a didReplace event is received. Each function
    *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
    *    first the second time a didReplace event occurs
    * @param {Function|Function[]} optionalOptions.onUpdate
    *    a function or a list of functions to call when a didUpdate event is received. Each function
    *    receives the event object as argument
    * @param {Function|Function[]} optionalOptions.onUpdateReplace
    *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
    *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
    *    only called first for didReplace events the second time such an event occurs
    * @param {Boolean} optionalOptions.omitFirstReplace
    *    if `true` `options.onReplace` is only called after the first time a didReplace event occurred.
    *    Default is `false`
    * @param {String} optionalOptions.modelKey
    *    the key to use for the resource in `context.resources`. If not given the value of `resource` is
    *    used
    *
    * @return {ResourceHandler}
    *    this instance for chaining
    */
   ResourceHandler.prototype.registerResource = function( resource, optionalOptions ) {
      assert( resource ).hasType( String ).isNotNull();

      optionalOptions = ax.object.options( optionalOptions, {
         omitFirstReplace: false,
         modelKey: resource
      } );
      this.waitingFor_.push( resource );
      registerResourceHandlers( this, resource, optionalOptions );

      if( !( resource in this.modelHandlers_ ) ) {
         this.modelHandlers_[ resource ] = {};
      }

      registerForReplace( this,  resource, optionalOptions );
      registerForUpdate( this, resource, optionalOptions );

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a callback that is called once all resources were initially replaced. If more resource
    * handlers are registered before all relevant didReplace events were received, those are also waited
    * for.
    *
    * @param {Function} callback
    *     the function to call
    * @param {Boolean} [optionalOptions]
    *    an optional set of parameters to specify watch behavior
    * @param {Boolean} optionalOptions.watch
    *    if `true`, the callback will be called again whenever resources are modified after all were
    *    replaced at least once
    *
    * @return {ResourceHandler}
    *    this instance for chaining
    */
   ResourceHandler.prototype.whenAllWereReplaced = function( callback, optionalOptions ) {
      assert( callback ).hasType( Function ).isNotNull();

      this.allReplacedCallback_ = optionalOptions && optionalOptions.watch ? callback : onceCallback;

      return this;

      function onceCallback() {
         callback();
         callback = function() {};
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Allows to find out if there are still outstanding resources, or if all resources have been replaced.
    * Can be used in update-/replace-handlers to determine if all dependencies are satisfied.
    *
    * @return {Boolean}
    *    `true` if all resources registered with this handler (so far) have been replaced at least once,
    *    `false` if there are still outstanding resources
    */
   ResourceHandler.prototype.wereAllReplaced = function() {
      return !this.waitingFor_.length;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function registerResourceHandlers( self, resource, options ) {
      if( !self.externalHandlers_[ resource ] ) {
         self.externalHandlers_[ resource ] = {
            onReplace: [],
            onUpdate: []
         };
      }

      appendFunctionOrArrayOfFunctions( self.externalHandlers_[ resource ].onUpdate, options.onUpdate );
      appendFunctionOrArrayOfFunctions( self.externalHandlers_[ resource ].onUpdate, options.onUpdateReplace );

      var replaceHandlers = [];
      appendFunctionOrArrayOfFunctions( replaceHandlers, options.onReplace );
      appendFunctionOrArrayOfFunctions( replaceHandlers, options.onUpdateReplace );

      if( options.omitFirstReplace ) {
         replaceHandlers = replaceHandlers.map( function( handler ) {
            return ignoringFirstCall( handler );
         } );
      }

      function ignoringFirstCall( f ) {
         var ignore = true;
         return function() {
            if( !ignore ) { return f.apply( self, arguments ); }
            ignore = false;
         };
      }

      appendFunctionOrArrayOfFunctions( self.externalHandlers_[ resource ].onReplace, replaceHandlers );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function registerForReplace( self, resource, options ) {
      var handler = replaceHandler( self.context_, options.modelKey );
      if( self.modelHandlers_[ resource ].onReplace ) {
         self.modelHandlers_[ resource ].onReplace.push( handler );
         return;
      }
      self.modelHandlers_[ resource ].onReplace = [ handler ];

      self.context_.eventBus.subscribe( 'didReplace.' + resource, function( event ) {
         var changed = self.modelHandlers_[ resource ].onReplace.reduce( function( changed, handler ) {
            return handler( event ) || changed;
         }, false );
         if( !changed ) {
            return;
         }

         try {
            self.externalHandlers_[ resource ].onReplace.forEach( function( handler ) {
               handler( event );
            } );
         }
         finally {
            self.waitingFor_.splice( self.waitingFor_.indexOf( resource ), 1 );
            if( !self.waitingFor_.length ) {
               self.allReplacedCallback_();
            }
         }

      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function registerForUpdate( self, resource, options ) {
      var handler = updateHandler( self.context_, options.modelKey );
      if( self.modelHandlers_[ resource ].onUpdate ) {
         self.modelHandlers_[ resource ].onUpdate.push( handler );
         return;
      }
      self.modelHandlers_[ resource ].onUpdate = [ handler ];

      self.context_.eventBus.subscribe( 'didUpdate.' + resource, function( event ) {
         var changed = self.modelHandlers_[ resource ].onUpdate.reduce( function( changed, handler ) {
            return handler( event ) || changed;
         }, false );
         if( !changed ) {
            return;
         }

         try {
            self.externalHandlers_[ resource ].onUpdate.forEach( function( handler ) {
               handler( event );
            } );
         }
         finally {
            if( !self.waitingFor_.length ) {
               self.allReplacedCallback_();
            }
         }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function appendFunctionOrArrayOfFunctions( target, funcOrArray ) {
      if( typeof funcOrArray === 'function' ) {
         target.push( funcOrArray );
         return;
      }

      if( Array.isArray( funcOrArray ) ) {
         Array.prototype.push.apply( target, funcOrArray );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function provideResourceBucket( context ) {
      if( !context.hasOwnProperty( 'resources' ) || typeof context.resources !== 'object' ) {
         context.resources = {};
      }

      return context.resources;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Tests if two objects represent the same resource.
    *
    * The test takes place as follows:
    *  - Let value of `counter` be zero.
    *  - For each attribute (or attribute path) in `attribute` test the following:
    *    - If both objects contain the attribute (or a defined value at the given path), check for
    *       identity using `===`.
    *       - If this check is negative, skip further testing and let the result of the function be `false`.
    *       - If it is positive, increment `counter`.
    *    - If none of the objects contains the attribute (or a defined value at the given path), skip to
    *       the next attribute.
    *    - If the attribute (or a defined value at the given path) exist only in one of the objects, skip
    *       further testing and let the result of the function be `false`.
    *  - If all attributes have been tested and the value of `counter` is greater than zero, let the result
    *    of the function be `true`, `false` otherwise.
    *
    * @param {Object} resourceA
    *    the first object to test
    * @param {Object} resourceB
    *    the second object to test
    * @param {String[]} compareAttributes
    *    the list of attributes determining resource identity
    *
    * @return {Boolean}
    *    `true` if both objects are assumed to represent the same resource, `false` otherwise
    */
   function isSame( resourceA, resourceB, compareAttributes ) {
      if( resourceA == null || resourceB == null ) {
         return false;
      }

      var matches = 0;
      for( var i = 0; i < compareAttributes.length; ++i ) {
         var key = compareAttributes[ i ];
         if( key.indexOf( '.' ) !== -1 ) {
            // Compare using ax.object.path (only if needed, for performance):
            var valueA = ax.object.path( resourceA, key );
            var valueB = ax.object.path( resourceB, key );
            if( valueA === undefined && valueB === undefined ) {
               continue;
            }
            if( valueA === valueB ) {
               ++matches;
            }
            else {
               return false;
            }
         }
         else {
            if( !( key in resourceA ) && !( key in resourceB ) ) {
               continue;
            }
            if( resourceA[key] === resourceB[key] ) {
               ++matches;
            }
            else {
               return false;
            }
         }
      }
      return matches > 0;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      replaceHandler: replaceHandler,
      updateHandler: updateHandler,
      replacePublisherForFeature: replacePublisherForFeature,
      updatePublisherForFeature: updatePublisherForFeature,
      isSame: isSame,
      handlerFor: handlerFor

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for creating event objects to be used with *didValidate* events.
 *
 * Validation messages can have one of the following structures:
 * - A simple html message object (locale to string mapping). It will get a default level of *ERROR*.
 * - A html message object as required by the messages widget consisting of a html message object under the
 *   key *htmlMessage* and a level under the key *level*.
 *
 * @module validation
 */
define( 'laxar-patterns/lib/validation',[], function() {
   'use strict';

   /**
    * @private
    */
   function createEvent( resource, htmlMessages, outcome ) {
      var data = [];
      if( htmlMessages && htmlMessages.length ) {
         data = htmlMessages.map( function( msg ) {
            if( msg.htmlMessage && msg.level ) {
               return msg;
            }

            return {
               htmlMessage: msg,
               level: 'ERROR'
            };
         } );
      }

      return {
         resource: resource,
         data: data,
         outcome: outcome
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * @private
    */
   function messagesFromArgs( messages, args ) {
      if( Array.isArray( messages ) ) {
         return messages;
      }
      return [].slice.call( args, 1 );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      /**
       * Creates and returns an event resembling a successful validation result.
       *
       * @param {String} resource
       *    name of the validated resource
       * @param {Object[]|...Object} htmlMessages
       *    messages associated with the result. They should have the structure as described in the module
       *
       * @return {Object}
       *    the validation event
       */
      successEvent: function( resource, htmlMessages ) {
         return createEvent( resource, messagesFromArgs( htmlMessages, arguments ), 'SUCCESS' );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Creates and returns an event resembling the result of a validation with errors.
       *
       * @param {String} resource name of the validated resource
       * @param {Object[]|...Object} htmlMessages
       *    messages associated with the result. They should have the structure as described in the module
       *
       * @return {Object}
       *    the validation event
       */
      errorEvent: function( resource, htmlMessages ) {
         return createEvent( resource, messagesFromArgs( htmlMessages, arguments ), 'ERROR' );
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *changeAreaVisibilityRequest* and
 * *didChangeAreaVisibility* events.
 *
 * @module visibility
 */
define( 'laxar-patterns/lib/visibility',[
   'laxar'
], function( ax ) {
   'use strict';

   /**
    * Creates a new handler instance for `didChangeAreaVisibility` events.
    *
    * @param {Object} scope
    *    the scope the handler should work with. It is expected to find an `eventBus` property there with
    *    which it can do the event handling. The visibility handler will manage the boolean scope property
    *    `isVisible` which can be used to determine the visibility state of the entire widget
    * @param {Object} [optionalOptions]
    *    additional options to pass to the visibility handler
    * @param {Function} optionalOptions.onChange
    *    a handler to call when a `didChangeAreaVisibility` request for this widget's container was received,
    *    and the visibility of this widget was changed
    * @param {Function} optionalOptions.onShow
    *    a handler to call when a `didChangeAreaVisibility` request for this widget's container was received,
    *    and the visibility of this widget was changed to `true`
    * @param {Function} optionalOptions.onHide
    *    a handler to call when a `didChangeAreaVisibility` request for this widget's container was received,
    *    and the visibility of this widget was changed to `false`
    * @param {Function} optionalOptions.onAnyAreaRequest
    *    a handler for any `changeAreaVisibilityRequest` to this widget's areas
    *    The handler must
    *     * _either_ return `true`/`false` to indicate visibility synchronously
    *     * _or_ issue a will/did-response for the area when called
    *
    * @return {VisibilityHandler}
    *    a visibility handler instance
    */
   function handlerFor( scope, optionalOptions ) {
      return new VisibilityHandler( scope, optionalOptions );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param scope
    * @param optionalOptions
    *
    * @constructor
    * @private
    */
   function VisibilityHandler( scope, optionalOptions ) {
      this.scope_ = scope;
      scope.isVisible = false;

      var options = ax.object.options( optionalOptions, {} );

      if( options.onAnyAreaRequest ) {
         var requestEvent = [ 'changeAreaVisibilityRequest', scope.widget.id ].join( '.' );
         scope.eventBus.subscribe( requestEvent, responder( this, options.onAnyAreaRequest ) );
      }

      var didEvent = [ 'didChangeAreaVisibility', scope.widget.area ].join( '.' );
      scope.eventBus.subscribe( didEvent, function( event ) {
         var wasVisible = scope.isVisible || false;
         scope.isVisible = event.visible;
         if( wasVisible === event.visible ) {
            return;
         }
         if( options.onChange ) {
            options.onChange( event );
         }
         if( options.onShow && event.visible ) {
            options.onShow( event );
         }
         else if( options.onHide && !event.visible ) {
            options.onHide( event );
         }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Handle change-visibility-requests for a specific area, using a callback.
    *
    * @param {String} areaName
    *    the name of the area for which to handle visibility events
    * @param {Object=} optionalOptions
    *    additional options to pass to the visibility handler
    * @param {Function=} optionalOptions.onRequest
    *    a callback for any `changeAreaVisibilityRequest` to this area. The callback may issue a
    *    will/did-response for the area when called, or return a boolean which causes the visibility handler
    *    to respond accordingly. This should not be used in conjunction with the global
    *    `onAnyAreaRequest`-option of the handler
    *
    * @return {VisibilityHandler}
    *    this instance for chaining
    */
   VisibilityHandler.prototype.registerArea = function( areaName, optionalOptions ) {
      var options = ax.object.options( optionalOptions, {} );
      if( options.onRequest ) {
         var requestEvent = [ 'changeAreaVisibilityRequest', areaName ].join( '.' );
         this.scope_.eventBus.subscribe( requestEvent,responder( this, options.onRequest ) );
      }
      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function responder( self, callback ) {
      return function( event ) {
         var result = callback( event );
         if( result === true || result === false ) {
            var didEvent = [ 'didChangeAreaVisibility', event.area, result ].join( '.' );
            self.scope_.eventBus.publish( didEvent, {
               area: event.area,
               visible: result
            }, { deliverToSender: false } );
         }
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Publishes `changeWidgetVisibilityRequest` events.
    *
    * @param {Object} scope
    *    a scope (with `widget` and `eventBus` properties)
    *
    * @return {Function}
    *    a function of boolean that requests for widget visibility to be set to the given state
    */
   function requestPublisherForWidget( scope ) {
      return function publish( visible ) {
         var eventName = [ 'changeWidgetVisibilityRequest', scope.widget.id, visible ].join( '.' );
         return scope.eventBus.publishAndGatherReplies( eventName, {
            widget: scope.widget.id,
            visible: visible
         }, { deliverToSender: false } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Publishes `changeAreaVisibilityRequest` events.
    *
    * @param {Object} scope
    *    a scope (with an `eventBus` property)
    * @param {String} area
    *    the name of a widget area whose visibility is to be controlled by the function returned
    *
    * @return {Function}
    *    a function of boolean that requests for the given area's visibility to be set to the given state
    */
   function requestPublisherForArea( scope, area ) {
      return function publish( visible ) {
         var eventName = [ 'changeAreaVisibilityRequest', area, visible ].join( '.' );
         return scope.eventBus.publishAndGatherReplies( eventName, {
            area: area,
            visible: visible
         }, { deliverToSender: false } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      handlerFor: handlerFor,
      requestPublisherForWidget: requestPublisherForWidget,
      requestPublisherForArea: requestPublisherForArea
   };

} );

/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar-patterns/laxar-patterns',[
   './lib/actions',
   './lib/errors',
   './lib/flags',
   './lib/i18n',
   './lib/json',
   './lib/patches',
   './lib/resources',
   './lib/validation',
   './lib/visibility'
], function( actions, errors, flags, i18n, json, patches, resources, validation, visibility ) {
   'use strict';

   return {
      actions: actions,
      errors: errors,
      flags: flags,
      i18n: i18n,
      json: json,
      patches: patches,
      resources: resources,
      validation: validation,
      visibility: visibility
   };

} );

define('laxar-patterns', ['laxar-patterns/laxar-patterns'], function (main) { return main; });

