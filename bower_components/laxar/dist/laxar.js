/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/logging/console_channel',[], function() {
   'use strict';

   function consoleLogger( messageObject ) {
      var console = window.console;
      if( !console ) { return; }

      var logMethod = messageObject.level.toLowerCase();
      if( !( logMethod in console ) || logMethod === 'trace' ) {
         // In console objects trace doesn't define a valid log level but is used to print stack traces. We
         // thus need to change it something different.
         logMethod = 'log';
      }

      if( !( logMethod in console ) ) {
         return;
      }

      var callArgs = [ messageObject.level + ': ' ];
      callArgs = callArgs.concat( mergeTextAndReplacements( messageObject.text, messageObject.replacements ) );
      callArgs.push( '(@ ' + messageObject.sourceInfo.file + ':' + messageObject.sourceInfo.line + ')' );

      call( console, logMethod, callArgs );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function call( console, method, messageParts ) {
      // MSIE8 does not support console.log.apply( ... )
      // The following call is equivalent to: console[ method ].apply( console, args );
      Function.apply.apply( console[ method ], [ console, messageParts ] );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function mergeTextAndReplacements( text, replacements ) {
      var pos = 0;
      var character;
      var buffer = '';
      var parts = [];

      while( pos < text.length ) {
         character = text.charAt( pos );

         switch( character ) {
            case '\\':
               ++pos;
               if( pos === text.length ) {
                  throw new Error( 'Unterminated string: "' + text + '"' );
               }

               buffer += text.charAt( pos );
               break;

            case '[':
               parts.push( buffer );
               buffer = '';

               var end = text.indexOf( ']', pos );
               if( end === -1 ) {
                  throw new Error( 'Unterminated replacement at character ' + pos + ': "' + text + '"' );
               }

               var replacementIndex = parseInt( text.substring( pos + 1, end ), 10 );

               parts.push( replacements[ replacementIndex ] );
               pos = end;

               break;

            default:
               buffer += character;
               break;
         }

         ++pos;
      }

      if( buffer.length > 0 ) {
         parts.push( buffer );
      }

      return parts;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return consoleLogger;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * The *assert* module provides some simple assertion methods for type checks, truthyness tests and guards
 * invalid code paths.
 *
 * When requiring `laxar`, it is available as `laxar.assert`.
 *
 * @module assert
 */
define( 'laxar/lib/utilities/assert',[], function() {
   'use strict';

   /**
    * Constructor for an Assertion.
    *
    * @param {*} subject
    *    the object assertions are made for
    * @param {String} [optionalDetails]
    *    details that should be printed in case no specific details are given for an assertion method
    *
    * @constructor
    * @private
    */
   function Assertion( subject, optionalDetails ) {
      this.subject_ = subject;
      this.details_ = optionalDetails || null;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Throws an error if the subject is `null` or `undefined`.
    *
    * @param {String} [optionalDetails]
    *    details to append to the error message
    *
    * @return {Assertion}
    *    this instance
    */
   Assertion.prototype.isNotNull = function isNotNull( optionalDetails ) {
      if( typeof this.subject_ === 'undefined' || this.subject_ === null ) {
         fail( 'Expected value to be defined and not null.', optionalDetails || this.details_ );
      }

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Throws an error if the subject is not of the given type. No error is thrown for `null` or `undefined`.
    *
    * @param {Function} type
    *    the expected type of the subject
    * @param {String} [optionalDetails]
    *    details to append to the error message
    *
    * @return {Assertion}
    *    this instance
    */
   Assertion.prototype.hasType = function hasType( type, optionalDetails ) {
      if( typeof this.subject_ === 'undefined' || this.subject_ === null ) {
         return this;
      }

      if( typeof type !== 'function' ) {
         fail( 'type must be a constructor function. Got ' + ( typeof type ) + '.' );
      }

      if( !checkType( this.subject_, type ) ) {
         var actualString = functionName( this.subject_.constructor );
         var expectedString = functionName( type );

         fail( 'Expected value to be an instance of "' + expectedString + '" but was "' + actualString + '".',
               optionalDetails || this.details_ );
      }

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Throws an error if the subject is no object or the given property is not defined on it.
    *
    * @param {String} property
    *    the property that is expected for the subject
    * @param {String} [optionalDetails]
    *    details to append to the error message
    *
    * @return {Assertion}
    *    this instance
    */
   Assertion.prototype.hasProperty = function hasProperty( property, optionalDetails ) {
      if( typeof this.subject_ !== 'object' ) {
         fail( 'value must be an object. Got ' + ( typeof this.subject_ ) + '.' );
      }

      if( !( property in this.subject_ ) ) {
         fail( 'value is missing mandatory property "' + property + '".', optionalDetails || this.details_ );
      }

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function fail( message, optionalDetails ) {
      if( optionalDetails ) {
         message += ' Details: ' +
            ( typeof optionalDetails === 'object' ? JSON.stringify( optionalDetails ) : optionalDetails );
      }
      throw new Error( 'Assertion error: ' + message );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var TYPE_TO_CONSTRUCTOR = {
      'string': String,
      'number': Number,
      'boolean': Boolean,
      'function': Function
   };
   function checkType( subject, type ) {
      if( typeof subject === 'object' ) {
         return subject instanceof type;
      }

      var actualType = TYPE_TO_CONSTRUCTOR[ typeof subject ];
      return actualType === type;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var FUNCTION_NAME_MATCHER = /^function ([^\(]*)\(/i;
   function functionName( func ) {
      var match = FUNCTION_NAME_MATCHER.exec( func.toString().trim() );
      return match[1].length ? match[1] : 'n/a';
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a new `Assertion` instance for the given `subject`.
    *
    * **Note**: this function is no member of the module, but the module itself. Thus when using `assert` via
    * laxar, `assert` is will be no simple object, but this function having the other functions as
    * properties.
    *
    * Example:
    * ```js
    * define( [ 'laxar' ], function( ax ) {
    *    ax.assert( ax.assert ).hasType( Function );
    *    ax.assert.state( typeof ax.assert.codeIsUnreachable === 'function' );
    * } );
    * ```
    *
    * @param {*} subject
    *    the object assertions are made for
    * @param {String} [optionalDetails]
    *    details that should be printed in case no specific details are given when calling an assertion method
    *
    * @return {Assertion}
    *    the assertion instance
    */
   function assert( subject, optionalDetails ) {
      return new Assertion( subject, optionalDetails );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Marks a code path as erroneous by throwing an error when reached.
    *
    * @param {String} [optionalDetails]
    *    details to append to the error message
    */
   assert.codeIsUnreachable = function codeIsUnreachable( optionalDetails ) {
      fail( 'Code should be unreachable!', optionalDetails );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Throws an error if the given expression is falsy.
    *
    * @param {*} expression
    *    the expression to test for truthyness
    * @param {String} [optionalDetails]
    *    details to append to the error message
    */
   assert.state = function state( expression, optionalDetails ) {
      if( !expression ) {
         fail( 'State does not hold.', optionalDetails );
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return assert;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Utilities for dealing with objects.
 *
 * When requiring `laxar`, it is available as `laxar.object`.
 *
 * @module object
 */
define( 'laxar/lib/utilities/object',[], function() {
   'use strict';

   var slice = Array.prototype.slice;

   /**
    * Copies the properties from a set of source objects over to the target object. Properties of sources
    * later in the arguments list overwrite existing properties in the target and earlier source objects.
    *
    * @param {Object} target
    *    the target object to modify
    * @param {...Object} sources
    *    the source objects to copy over
    *
    * @return {Object}
    *    the modified target object
    *
    * @type {Function}
    */
   function extend( target, sources ) {
      return applyForAll( slice.call( arguments, 0 ), function( target, source, key ) {
         target[ key ] = source[ key ];
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Returns all properties from `obj` with missing properties completed from `defaults`. If `obj` is `null`
    * or `undefined`, an empty object is automatically created. `obj` and `defaults` are not modified by this
    * function. This is very useful for optional map arguments, resembling some kind of configuration.
    *
    * Example:
    * ```js
    * object.options( { validate: true }, {
    *    validate: false,
    *    highlight: true
    * } );
    * // =>
    * // {
    * //    validate: true,
    * //    highlight: true
    * // }
    * ```
    *
    * @param {Object} obj
    *    the options object to use as source, may be `null` or `undefined`
    * @param {Object} defaults
    *    the defaults to take missing properties from
    *
    * @return {Object}
    *    the completed options object
    */
   function options( obj, defaults ) {
      return extend( {}, defaults, obj );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Iterates over the keys of an object and calls the given iterator function for each entry. On each
    * iteration the iterator function is passed the `value`, the `key` and the complete `object` as
    * arguments. If `object` is an array, the native `Array.prototype.forEach` function is called and hence
    * the keys are the numeric indices of the array.
    *
    * @param {Object} object
    *    the object to run the iterator function on
    * @param {Function} iteratorFunction
    *    the iterator function to run on each key-value pair
    */
   function forEach( object, iteratorFunction ) {
      if( Array.isArray( object ) ) {
         object.forEach( iteratorFunction );
         return;
      }

      for( var key in object ) {
         if( hasOwnProperty( object, key ) ) {
            iteratorFunction( object[ key ], key, object );
         }
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Finds a property in a nested object structure by a given path. A path is a string of keys, separated
    * by a dot from each other, used to traverse that object and find the value of interest. An additional
    * default is returned, if otherwise the value would yield `undefined`.
    *
    * Example.
    * ```js
    * object.path( { one: { two: 3 } }, 'one.two' ); // => 3
    * object.path( { one: { two: 3 } }, 'one.three' ); // => undefined
    * object.path( { one: { two: 3 } }, 'one.three', 42 ); // => 42
    *
    * ```
    *
    * @param {Object} obj
    *    the object to traverse
    * @param {String} thePath
    *    the path to search for
    * @param {*} [optionalDefault]
    *    the value to return instead of `undefined` if nothing is found
    *
    * @return {*}
    *    the value at the given path
    */
   function path( obj, thePath, optionalDefault ) {
      var defaultResult = arguments.length === 3 ? optionalDefault : undefined;

      var pathArr = thePath.split( '.' );
      var node = obj;
      var key = pathArr.shift();

      while( key ) {
         if( node && typeof node === 'object' && hasOwnProperty( node, key ) ) {
            node = node[ key ];
            key = pathArr.shift();
         }
         else {
            return defaultResult;
         }
      }

      return node;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets a property in a nested object structure at a given path to a given value. A path is a string of
    * keys, separated by a dot from each other, used to traverse that object and find the place where the
    * value should be set. Any missing subtrees along the path are created.
    *
    * Example:
    * ```js
    * object.setPath( {}, 'name.first', 'Peter' ); // => { name: { first: 'Peter' } }
    * object.setPath( {}, 'pets.1', 'Hamster' ); // => { pets: [ null, 'Hamster' ] }
    * ```
    *
    * @param {Object} obj
    *    the object to modify
    * @param {String} path
    *    the path to set a value at
    * @param {*} value
    *    the value to set at the given path
    *
    * @return {*}
    *    the full object (for chaining)
    */
   function setPath( obj, path, value ) {
      var node = obj;
      var pathArr = path.split( '.' );
      var last = pathArr.pop();

      pathArr.forEach( function( pathFragment, index ) {
         if( !node[ pathFragment ] || typeof node[ pathFragment ] !== 'object' ) {
            var lookAheadFragment = pathArr[ index + 1 ] || last;
            if( lookAheadFragment.match( /^[0-9]+$/ ) ) {
               node[ pathFragment ] = [];
               fillArrayWithNull( node[ pathFragment ], parseInt( lookAheadFragment, 10 ) );
            }
            else {
               node[ pathFragment ] = {};
            }
         }

         node = node[ pathFragment ];
      } );

      if( Array.isArray( node ) && last > node.length ) {
         fillArrayWithNull( node, last );
      }

      node[ last ] = value;

      return obj;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Returns a deep clone of the given object. Note that the current implementation is intended to be used
    * for simple object literals only. There is no guarantee that cloning objects instantiated via
    * constructor function works and cyclic references will lead to endless recursion.
    *
    * @param {*} object
    *    the object to clone
    *
    * @return {*}
    *    the clone
    */
   function deepClone( object ) {
      if( !object || typeof object !== 'object' ) {
         return object;
      }

      // Not using underscore here for performance reasons. Plain for-loops are twice as fast as each and map
      // in all common browsers.
      var result;
      if( Array.isArray( object ) ) {
         result = [];
         for( var i = 0, length = object.length; i < length; ++i ) {
            result[ i ] = deepClone( object[ i ] );
         }
      }
      else {
         result = {};
         for( var key in object ) {
            if( hasOwnProperty( object, key ) )  {
               result[ key ] = deepClone( object[ key ] );
            }
         }
      }

      return result;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Freezes an object, optionally recursively, in any browser capable of freezing objects. In any other
    * browser this method simply returns its first value, i.e. is an identity operation.
    *
    * @param {Object} obj
    *    the object to freeze
    * @param {Boolean} [optionalRecursive]
    *    freezes recursively if `true`. Default is `false`
    *
    * @return {Object}
    *    the input (possibly) frozen
    */
   function deepFreeze( obj, optionalRecursive ) {
      if( Object.isFrozen( obj ) ) {
         return obj;
      }

      if( optionalRecursive ) {
         forEach( obj, function( val, key ) {
            if( typeof val === 'object' ) {
               obj[ key ] = deepFreeze( val, true );
            }
         } );
      }

      return Object.freeze( obj );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets all entries of the given array to `null`.
    *
    * @private
    */
   function fillArrayWithNull( arr, toIndex ) {
      for( var i = arr.length; i < toIndex; ++i ) {
         arr[ i ] = null;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Takes a list of objects where the first entry is treated as target object and all other entries as
    * source objects. The callback then is called for each property of each source object. Finally target is
    * returned.
    *
    * @private
    */
   function applyForAll( objects, callback ) {
      var target = objects[0];
      objects.slice( 1 ).forEach( function( source ) {
         if( source ) {
            for( var key in source ) {
               if( hasOwnProperty( source, key ) ) {
                  callback( target, source, key );
               }
            }
         }
      } );
      return target;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function hasOwnProperty( object, property ) {
      return hasOwnProp.call( object, property );
   }
   var hasOwnProp = Object.prototype.hasOwnProperty;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      extend: extend,
      options: options,
      forEach: forEach,
      path: path,
      setPath: setPath,
      deepClone: deepClone,
      deepFreeze: typeof Object.freeze === 'function' ? deepFreeze : function( _ ) { return _; }
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * The *configuration* module provides convenient readonly access to all values configured for this application
 * under `window.laxar`. Most probably this configuration takes place in the JavaScript file
 * `application/application.js` under your project's root directory.
 *
 * When requiring `laxar`, it is available as `laxar.configuration`.
 *
 * @module configuration
 */
define( 'laxar/lib/utilities/configuration',[
   './object'
], function( object ) {
   'use strict';

   /*jshint evil:true*/
   /**
    * Obtain global object in strict mode: http://stackoverflow.com/questions/3277182/
    *
    * private tag needed for api doc generation. Otherwise the module description becomes messed up.
    *
    * @private
    */
   var global = new Function( 'return this' )();

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      /**
       * Returns the configured value for the specified attribute path or `undefined` in case it wasn't
       * configured. If a default value was passed as second argument this is returned instead of `undefined`.
       *
       * Examples:
       * ```js
       * define( [ 'laxar' ], function( ax ) {
       *    ax.configuration.get( 'logging.threshold' ); // -> 'INFO'
       *    ax.configuration.get( 'iDontExist' ); // -> undefined
       *    ax.configuration.get( 'iDontExist', 42 ); // -> 42
       * } );
       * ```
       *
       * @param {String} key
       *    a  path (using `.` as separator) to the property in the configuration object
       * @param {*} [optionalDefault]
       *    the value to return if no value was set for `key`
       *
       * @return {*}
       *    either the configured value, `undefined` or `optionalDefault`
       */
      get: function( key, optionalDefault ) {
         return object.path( global.laxar, key, optionalDefault );
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * An interface for logging purposes. At least for permanent logging this should always be used in favor of
 * `console.log` and friends, as it is cross browser secure and allows attaching multiple channels where
 * messages can be routed to (i.e. to send them to a server process for persistence). If available, messages
 * will be logged to the browser's console using a builtin console channel.
 *
 * When requiring `laxar`, an instance of the `Logger` type is available as `laxar.log`.
 *
 * @module log
 */
define( 'laxar/lib/logging/log',[
   './console_channel',
   '../utilities/assert',
   '../utilities/object',
   '../utilities/configuration'
], function( consoleChannel, assert, object, configuration ) {
   'use strict';

   var slice = Array.prototype.slice;
   /**
    * By default available log levels, sorted by increasing log level:
    * - TRACE (level 100)
    * - DEBUG (level 200)
    * - INFO (level 300)
    * - WARN (level 400)
    * - ERROR (level 500)
    * - FATAL (level 600)
    *
    * @type {Object}
    */
   var level = {
      TRACE: 100,
      DEBUG: 200,
      INFO: 300,
      WARN: 400,
      ERROR: 500,
      FATAL: 600
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Constructor for a logger.
    *
    * @constructor
    * @private
    */
   function Logger() {
      this.queueSize_ = 100;
      this.channels_ = [ consoleChannel ];
      this.counter_ = 0;
      this.messageQueue_ = [];
      this.threshold_ = 0;
      this.tags_ = {};

      this.level = object.options( configuration.get( 'logging.levels', {} ), level );
      this.levelToName_ = ( function( logger, levels ) {
         var result = {};
         object.forEach( levels, function( level, levelName ) {
            logger[ levelName.toLowerCase() ] = function() {
               var args = [ level ].concat( slice.call( arguments, 0 ) );
               return this.log.apply( this, args );
            };
            result[ level ] = levelName;
         } );
         return result;
      } )( this, this.level );

      this.setLogThreshold( configuration.get( 'logging.threshold', 'INFO' ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a new logger instance. Intended for testing purposes only.
    *
    * @return {Logger}
    *    a new logger instance
    */
   Logger.prototype.create = function() {
      return new Logger();
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Logs a message. A message may contain placeholders in the form `[#]` where `#` resembles the index
    * within the list of `replacements`. `replacements` are incrementally counted starting at `0`. If the
    * log level is below the configured log threshold, the message is simply discarded.
    *
    * It is recommended not to use this method directly, but instead one of the short cut methods for the
    * according log level.
    *
    * @param {Number} level
    *    the level for this message
    * @param {String} message
    *    the message to log
    * @param {...*} replacements
    *    objects that should replace placeholders within the message
    */
   Logger.prototype.log = function( level, message, replacements ) {
      if( level < this.threshold_ ) {
         return;
      }

      var messageObject = {
         id: this.counter_++,
         level: this.levelToName_[ level ],
         text: message,
         replacements: slice.call( arguments, 2 ) || [],
         time: new Date(),
         tags: this.gatherTags(),
         sourceInfo: gatherSourceInformation()
      };
      this.channels_.forEach( function( channel ) {
         channel( messageObject );
      } );

      if( this.messageQueue_.length === this.queueSize_ ) {
         this.messageQueue_.shift();
      }
      this.messageQueue_.push( messageObject );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Logs a message in log level `TRACE`. See {@link Logger#log} for further information.
    *
    * *Important note*: This method is only available, if no custom log levels were defined via
    * configuration or custom log levels include this method as well.
    *
    * @param {String} message
    *    the message to log
    * @param {...*} replacements
    *    objects that should replace placeholders within the message
    */
   Logger.prototype.trace = function() {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Logs a message in log level `DEBUG`. See {@link Logger#log} for further information.
    *
    * *Important note*: This method is only available, if no custom log levels were defined via
    * configuration or custom log levels include this method as well.
    *
    * @param {String} message
    *    the message to log
    * @param {...*} replacements
    *    objects that should replace placeholders within the message
    */
   Logger.prototype.debug = function() {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Logs a message in log level `INFO`. See {@link Logger#log} for further information.
    *
    * *Important note*: This method is only available, if no custom log levels were defined via
    * configuration or custom log levels include this method as well.
    *
    * @param {String} message
    *    the message to log
    * @param {...*} replacements
    *    objects that should replace placeholders within the message
    */
   Logger.prototype.info = function() {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Logs a message in log level `WARN`. See {@link Logger#log} for further information.
    *
    * *Important note*: This method is only available, if no custom log levels were defined via
    * configuration or custom log levels include this method as well.
    *
    * @param {String} message
    *    the message to log
    * @param {...*} replacements
    *    objects that should replace placeholders within the message
    */
   Logger.prototype.warn = function() {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Logs a message in log level `ERROR`. See {@link Logger#log} for further information.
    *
    * *Important note*: This method is only available, if no custom log levels were defined via
    * configuration or custom log levels include this method as well.
    *
    * @param {String} message
    *    the message to log
    * @param {...*} replacements
    *    objects that should replace placeholders within the message
    */
   Logger.prototype.error = function() {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Logs a message in log level `FATAL`. See {@link Logger#log} for further information.
    *
    * *Important note*: This method is only available, if no custom log levels were defined via
    * configuration or custom log levels include this method as well.
    *
    * @param {String} message
    *    the message to log
    * @param {...*} replacements
    *    objects that should replace placeholders within the message
    */
   Logger.prototype.fatal = function() {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Adds a new channel to forward log messages to. A channel is called synchronously for every log message
    * and can do whatever necessary to handle the message according to its task. Note that blocking or
    * performance critical actions within a channel should always take place asynchronously to prevent from
    * blocking the application. Ideally a web worker is used for heavier background tasks.
    *
    * Each message is an object having the following properties:
    * - `id`: the unique, ascending id of the log message
    * - `level`: the log level of the message in string representation
    * - `text`: the actual message that was logged
    * - `replacements`: the raw list of replacements passed along the message
    * - `time`: JavaScript Date instance when the message was logged
    * - `tags`: A map of all log tags currently set for the logger
    * - `sourceInfo`: if supported, a map containing `file`, `line` and `char` where the logging took place
    *
    * @param {Function} channel
    *    the log channel to add
    */
   Logger.prototype.addLogChannel = function( channel ) {
      this.channels_.push( channel );
      this.messageQueue_.forEach( function( entry ) {
         channel( entry );
      } );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Removes a log channel and thus stops sending further messages to it.
    *
    * @param {Function} channel
    *    the log channel to remove
    */
   Logger.prototype.removeLogChannel = function( channel ) {
      var channelIndex = this.channels_.indexOf( channel );
      if( channelIndex > -1 ) {
         this.channels_.splice( channelIndex, 1 );
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Adds a value for a log tag. If a tag is already known, the value is appended to the existing one using a
    * `;` as separator. Note that no formatting of the value takes place and a non-string value will just have
    * its appropriate `toString` method called.
    *
    * Log tags can be used to mark a set of log messages with a value giving further information on the
    * current logging context. For example laxar sets a tag `'INST'` with a unique-like identifier for the
    * current browser client. If then for example log messages are persisted on a server, messages belonging
    * to the same client can be accumulated.
    *
    * @param {String} tag
    *    the id of the tag to add a value for
    * @param {String} value
    *    the value to add
    */
   Logger.prototype.addTag = function( tag, value ) {
      assert( tag ).hasType( String ).isNotNull();

      if( !this.tags_[ tag ] ) {
         this.tags_[ tag ] = [ value ];
      }
      else {
         this.tags_[ tag ].push( value );
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets a value for a log tag. If a tag is already known, the value is overwritten by the given one. Note
    * that no formatting of the value takes place and a non-string value will just have its appropriate
    * `toString` method called. For further information on log tags, see {@link Logger#addTag}.
    *
    * @param {String} tag
    *    the id of the tag to set a value for
    * @param {String} value
    *    the value to set
    */
   Logger.prototype.setTag = function( tag, value ) {
      assert( tag ).hasType( String ).isNotNull();

      this.tags_[ tag ] = [ value ];
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Removes a log tag. For further information on log tags, see {@link Logger#addTag}.
    *
    * @param {String} tag
    *    the id of the tag to set a value for
    */
   Logger.prototype.removeTag = function( tag ) {
      assert( tag ).hasType( String ).isNotNull();

      delete this.tags_[ tag ];
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Returns a map of all tags. If there are multiple values for the same tag, their values are concatenated
    * using a `;` as separator. For further information on log tags, see {@link Logger#addTag}.
    *
    * @return {Object}
    *    a mapping from tag to its value(s)
    */
   Logger.prototype.gatherTags = function() {
      var tags = {};
      object.forEach( this.tags_, function( values, tag ) {
         tags[ tag ] = values.join( ';' );
      } );
      return tags;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets the threshold for log messages. Log messages with a lower level will be discarded upon logging.
    *
    * @param {String|Number} threshold
    *    the numeric or the string value of the log level to use as threshold
    */
   Logger.prototype.setLogThreshold = function( threshold ) {
      if( typeof threshold === 'string' ) {
         assert.state( threshold.toUpperCase() in this.level, 'Unsupported log threshold "' + threshold + '".' );

         threshold = this.level[ threshold.toUpperCase() ];
      }

      assert( threshold ).hasType( Number );

      this.threshold_ = threshold;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var CHROME_STACK_MATCHER = /\(?([^\( ]+\.js)\:(\d+)\:(\d+)\)?$/;
   var FIRE_FOX_STACK_MATCHER = /@(.+)\:(\d+)$/;
   var EMPTY_CALL_INFORMATION = { file: '?', line: -1, char: -1 };

   function gatherSourceInformation() {
      var e = new Error();

      if( !e.stack ) {
         return EMPTY_CALL_INFORMATION;
      }

      var rows = e.stack.split( /[\n]/ );
      var interpreterFunction;
      if( rows[0] === 'Error' ) {
         rows.splice( 0, 1 );
         interpreterFunction = function chromeStackInterpreter( row ) {
            var match = CHROME_STACK_MATCHER.exec( row );
            return {
               file: match ? match[1] : '?',
               line: match ? match[2] : -1,
               char: match ? match[3] : -1
            };
         };
      }
      else if( rows[0].indexOf( '@' ) !== -1 ) {
         interpreterFunction = function fireFoxStackInterpreter( row ) {
            var match = FIRE_FOX_STACK_MATCHER.exec( row );
            return {
               file: match ? match[1] : '?',
               line: match ? match[2] : -1,
               char: -1
            };
         };
      }
      else {
         return EMPTY_CALL_INFORMATION;
      }

      for( var i = 0; i < rows.length; ++i ) {
         var row = interpreterFunction( rows[ i ] );
         if( row.file.indexOf( '/logging/log.js' ) === -1 ) {
            return row;
         }
      }

      return EMPTY_CALL_INFORMATION;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return new Logger();

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * A module for the `axId` and `axFor` directives.
 *
 * @module axId
 */
define( 'laxar/lib/directives/id/id',[
   'angular',
   '../../utilities/assert'
], function( ng, assert ) {
   'use strict';

   var module = ng.module( 'axId', [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var ID_DIRECTIVE_NAME = 'axId';
   /**
    * This directive should be used within a widget whenever a unique id for a DOM element should be created.
    * It's value is evaluated as AngularJS expression and used as a local identifier to generate a distinct,
    * unique document wide id.
    *
    * A common use case is in combination with {@link axFor} for input fields having a label.
    *
    * Example:
    * ```html
    * <label ax-for="'userName'">Please enter your name:</label>
    * <input ax-id="'userName'" type="text" ng-model="username">
    * ```
    *
    * @name axId
    * @directive
    */
   module.directive( ID_DIRECTIVE_NAME, [ function() {
      return {
         restrict: 'A',
         link: function( scope, element, attrs ) {
            var localId = scope.$eval( attrs[ ID_DIRECTIVE_NAME ] );
            assert
               .state( localId, 'directive axId needs a non-empty local id, e.g. ax-id="\'myLocalId\'".' );

            element.attr( 'id', scope.id( localId ) );
         }
      };
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var FOR_DIRECTIVE_NAME = 'axFor';
   /**
    * This directive should be used within a widget whenever an id, generated using the {@link axId} directive,
    * should be referenced at a `label` element.
    *
    * Example:
    * ```html
    * <label ax-for="'userName'">Please enter your name:</label>
    * <input ax-id="'userName'" type="text" ng-model="username">
    * ```
    *
    * @name axFor
    * @directive
    */
   module.directive( FOR_DIRECTIVE_NAME, [ function() {
      return {
         restrict: 'A',
         link: function( scope, element, attrs ) {
            var localId = scope.$eval( attrs[ FOR_DIRECTIVE_NAME ] );
            assert
               .state( localId, 'directive axFor needs a non-empty local id, e.g. ax-for="\'myLocalId\'".' );

            element.attr( 'for', scope.id( localId ) );
         }
      };
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * A module for the `axLayout` directive.
 *
 * @module axLayout
 */
define( 'laxar/lib/directives/layout/layout',[
   'angular',
   '../../logging/log'
], function( ng, log ) {
   'use strict';

   var module = ng.module( 'axLayout', [] );

   var DIRECTIVE_NAME = 'axLayout';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * This directive uses the *axLayoutLoader* service to load a given layout and compile it as child to the
    * element the directive is set on. In contrast to *ngInclude* it doesn't watch the provided expression for
    * performance reasons and takes LaxarJS theming into account when loading the assets.
    *
    * @name axLayout
    * @directive
    */
   module.directive( DIRECTIVE_NAME, [ 'axLayoutLoader', '$compile', function( layoutLoader, $compile ) {

      return {
         restrict: 'A',
         link: function( scope, element, attrs ) {
            var layoutName = scope.$eval( attrs[ DIRECTIVE_NAME ] );
            layoutLoader.load( layoutName )
               .then( function( layoutInfo ) {
                  element.html( layoutInfo.htmlContent );
                  element.addClass( layoutInfo.className );
                  $compile( element.contents() )( scope );
                  scope.$emit( 'axLayoutLoaded', layoutName );
               }, function( err ) {
                  log.error( 'axLayout: could not load layout [0], error: [1]', layoutName, err );
               } );
         }
      };

   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Utilities for dealing with strings.
 *
 * When requiring `laxar`, it is available as `laxar.string`.
 *
 * @module object
 */
define( 'laxar/lib/utilities/string',[], function() {
   'use strict';

   var DEFAULT_FORMATTERS = {
      's': function( input ) {
         return '' + input;
      },

      'd': function( input ) {
         return input.toFixed( 0 );
      },

      'i': function( input, subSpecifierString ) {
         return DEFAULT_FORMATTERS.d( input, subSpecifierString );
      },

      'f': function( input, subSpecifierString ) {
         var precision = subSpecifierString.match( /^\.(\d)$/ );
         if( precision ) {
            return input.toFixed( precision[1] );
         }

         return '' + input;
      },

      'o': function( input ) {
         return JSON.stringify( input );
      },

      'default': function( input, subSpecifierString ) {
         return DEFAULT_FORMATTERS.s( input, subSpecifierString );
      }
   };

   if( typeof Object.freeze === 'function' ) {
      Object.freeze( DEFAULT_FORMATTERS );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Substitutes all unescaped placeholders in the given string for a given indexed or named value.
    * A placeholder is written as a pair of brackets around the key of the placeholder. An example of an
    * indexed placeholder is `[0]` and a named placeholder would look like this `[replaceMe]`. If no
    * replacement for a key exists, the placeholder will simply not be substituted.
    *
    * Some examples:
    * ```javascript
    * string.format( 'Hello [0], how do you like [1]?', [ 'Peter', 'Cheeseburgers' ] );
    * // => 'Hello Peter, how do you like Cheeseburgers?'
    * ```
    * ```javascript
    * string.format( 'Hello [name] and [partner], how do you like [0]?', [ 'Pizza' ], {
    *    name: 'Hans',
    *    partner: 'Roswita'
    * } );
    * // => 'Hello Hans and Roswita, how do you like Pizza?'
    * ```
    * If a pair of brackets should not be treated as a placeholder, the opening bracket can simply be escaped
    * by backslashes (thus to get an actual backslash in a JavaScript string literal, which is then treated as
    * an escape symbol, it needs to be written as double backslash):
    * ```javascript
    * string.format( 'A [something] should eventually only have \\[x].', {
    *    something: 'checklist'
    * } );
    * // => 'A checklist should eventually only have [x].'
    * ```
    * A placeholder key can be any character string besides `[`, `]` and `:` to keep parsing simple and fast.
    * By using `:` as separator it is possible to provide a type specifier for string serialization or other
    * additional mapping functions for the value to insert. Type specifiers always begin with an `%` and end
    * with the specifier type. Builtin specifier types are the following:
    *
    * - `%d` / `%i`: Format the given numeric value as integer. Decimal places are removed.
    * - `%f`: Format the given numeric value as floating point value. This specifier supports precision as
    *   sub-specifier (e.g. `%.2f` for 2 decimal places).
    * - `%s`: use simple string serialization using `toString`.
    * - `%o`: Format complex objects using `JSON.stringify`.
    *
    * When no specifier is provided, by default `%s` is assumed.
    *
    * Example:
    * ```javascript
    * string.format( 'Hello [0:%s], you owe me [1:%.2f] euros.', [ 'Peter', 12.1243 ] );
    * // => 'Hello Peter, you owe me 12.12 euros.'
    * ```
    *
    * Mapping functions should instead consist of simple strings and may not begin with a `%` character. It is
    * advised to use the same naming rules as for simple JavaScript functions. Type specifiers and mapping
    * functions are applied in the order they appear within the placeholder.
    *
    * An example, where we assume that the mapping functions `flip` and `double` where defined by the user
    * when creating the `formatString` function using {@link createFormatter}:
    * ```javascript
    * formatString( 'Hello [0:%s:flip], you owe me [1:double:%.2f] euros.', [ 'Peter', 12 ] );
    * // => 'Hello reteP, you owe me 24.00 euros.'
    * ```
    *
    * Note that there currently exist no builtin mapping functions.
    *
    * If a type specifier is used that doesn't exist, an exception is thrown. In contrast to that the use of
    * an unknown mapping function results in a no-op. This is on purpose to be able to use filter-like
    * functions that, in case they are defined for a formatter, transform a value as needed and in all other
    * cases simply are ignored and don't alter the value.
    *
    * @param {String} string
    *    the string to replace placeholders in
    * @param {Array} [optionalIndexedReplacements]
    *    an optional array of indexed replacements
    * @param {Object} [optionalNamedReplacements]
    *    an optional map of named replacements
    *
    * @return {String}
    *    the string with placeholders substituted for their according replacements
    */
   function format( string, optionalIndexedReplacements, optionalNamedReplacements ) {
      return DEFAULT_FORMATTER( string, optionalIndexedReplacements, optionalNamedReplacements );
   }
   var DEFAULT_FORMATTER = createFormatter( DEFAULT_FORMATTERS );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a new format function having the same api as {@link format}. If the first argument is
    * omitted or `null`, the default formatters for type specifiers are used. Otherwise only the provided map
    * of specifiers is available to the returned format function. Each key of the map is a specifier character
    * where the `%` is omitted and the value is the formatting function. A formatting function receives the
    * value to format (i.e. serialize) and the sub-specifier (if any) as arguments. For example for the format
    * specifier `%.2f` the sub-specifier would be `.2` where for `%s` it would simply be the empty string.
    *
    * Example:
    * ```javascript
    * var format = string.createFormatter( {
    *    'm': function( value ) {
    *       return value.amount + ' ' + value.currency;
    *    },
    *    'p': function( value, subSpecifier ) {
    *       return Math.pow( value, parseInt( subSpecifier, 10 ) );
    *    }
    * } );
    *
    * format( 'You owe me [0:%m].', [ { amount: 12, currency: 'EUR' } ] );
    * // => 'You owe me 12 EUR.'
    *
    * format( '[0]^3 = [0:%3p]', [ 2 ] );
    * // => '2^3 = 8'
    * ```
    *
    * The second argument is completely additional to the behavior of the default {@link format}
    * function. Here a map from mapping function id to actual mapping function can be passed in. Whenever the
    * id of a mapping function is found within the placeholder, that mapping function is called with the
    * current value and its return value is either passed to the next mapping function or rendered
    * instead of the placeholder if there are no more mapping function ids or type specifiers within the
    * placeholder string.
    *
    * ```javascript
    * var format = string.createFormatter( null, {
    *    flip: function( value ) {
    *       return ( '' + s ).split( '' ).reverse().join( '' );
    *    },
    *    double: function( value ) {
    *       return value * 2;
    *    }
    * } );
    *
    * format( 'Hello [0:%s:flip], you owe me [1:double:%.2f] euros.', [ 'Peter', 12 ] );
    * // => 'Hello reteP, you owe me 24.00 euros.'
    * ```
    *
    * @param {Object} typeFormatters
    *    map from format specifier (single letter without leading `%`) to formatting function
    * @param {Object} [optionalValueMappers]
    *    map from mapping identifier to mapping function
    *
    * @return {Function}
    *    A function having the same api as {@link format}
    */
   function createFormatter( typeFormatters, optionalValueMappers ) {

      if( !typeFormatters ) {
         typeFormatters = DEFAULT_FORMATTERS;
      }
      if( !optionalValueMappers ) {
         optionalValueMappers = {};
      }

      function format( string, optionalIndexedReplacements, optionalNamedReplacements ) {
         if( typeof string !== 'string' ) {
            return defaultTypeFormatter( typeFormatters )( string );
         }

         var indexed = Array.isArray( optionalIndexedReplacements ) ? optionalIndexedReplacements : [];
         var named = {};
         if( optionalNamedReplacements ) {
            named = optionalNamedReplacements || {};
         }
         else if( !Array.isArray( optionalIndexedReplacements ) ) {
            named = optionalIndexedReplacements || {};
         }

         var chars = string.split( '' );
         var output = '';
         for( var i = 0, len = chars.length; i < len; ++i ) {
            if( chars[i] === BACKSLASH ) {
               if( i + 1 === len ) {
                  throw new Error( 'Unterminated escaping sequence at index ' + i + ' of string: "' +
                     string + '".' );
               }

               output += chars[ ++i ];
            }
            else if( chars[i] === OPENING_BRACKET ) {
               var closingIndex = string.indexOf( CLOSING_BRACKET, i + 1 );
               if( closingIndex === -1 ) {
                  throw new Error( 'Unterminated placeholder at index ' + i + ' of string: "' +
                     string + '".' );
               }

               var key = string.substring( i + 1, closingIndex );

               output += replacePlaceholder( key, named, indexed, { string: string, index: i } );

               i = closingIndex;
            }
            else {
               output += chars[ i ];
            }
         }
         return output;
      }

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function replacePlaceholder( placeholder, named, indexed, context ) {
         var specifier = '';
         var subSpecifierString = '';
         var placeholderParts = placeholder.split( ':' );
         var key = placeholderParts[0];

         var value;
         if( INTEGER_MATCHER.test( key ) && key < indexed.length ) {
            value = indexed[ key ];
         }
         else if( key in named ) {
            value = named[ key ];
         }
         else {
            return OPENING_BRACKET + placeholder + CLOSING_BRACKET;
         }

         if( placeholderParts.length > 1 ) {

            if( placeholderParts[ 1 ].charAt( 0 ) !== '%' ) {
               value = defaultTypeFormatter( typeFormatters )( value );
            }

            return placeholderParts.slice( 1 ).reduce( function( value, part ) {
               if( part.indexOf( '%' ) === 0 ) {
                  var specifierMatch = part.match( /^%(.*)(\w)$/ );
                  specifier = specifierMatch ? specifierMatch[ 2 ] : '';
                  subSpecifierString = specifierMatch ? specifierMatch[ 1 ] : '';
                  if( specifier in typeFormatters ) {
                     return typeFormatters[ specifier ]( value, subSpecifierString );
                  }
                  else {
                     var knownSpecifiers = Object.keys( typeFormatters )
                        .filter( function( _ ) { return  _ !== 'default'; } )
                        .map( function( _ ) { return '%' + _; } )
                        .join( ', ' );

                     throw new Error( 'Unknown format specifier "%' + specifier + '" for placeholder' +
                        ' at index ' + context.index + ' of string: "' + context.string +
                        '" (Known specifiers are: ' + knownSpecifiers + ').' );
                  }
               }
               else if( part in optionalValueMappers ) {
                  return optionalValueMappers[ part ]( value );
               }

               return value;
            }, value );
         }

         return defaultTypeFormatter( typeFormatters )( value );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return format;

   }
   var BACKSLASH = '\\';
   var OPENING_BRACKET = '[';
   var CLOSING_BRACKET = ']';
   var INTEGER_MATCHER = /^[0-9]+$/;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function defaultTypeFormatter( typeFormatters ) {
      if( 'default' in typeFormatters ) {
         return typeFormatters[ 'default' ];
      }

      return DEFAULT_FORMATTERS[ 'default' ];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      format: format,
      createFormatter: createFormatter,
      DEFAULT_FORMATTERS: DEFAULT_FORMATTERS
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * A module for the `axWidgetArea` directive.
 *
 * @module axWidgetArea
 */
define( 'laxar/lib/directives/widget_area/widget_area',[
   'angular',
   '../../utilities/string'
], function( ng, string ) {
   'use strict';

   var module = ng.module( 'axWidgetArea', [] );

   var DIRECTIVE_NAME = 'axWidgetArea';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * The *axWidgetArea* directive is used to mark DOM elements as possible containers for widgets. They're
    * most commonly used in layouts using static names. These areas can then be referenced from within page
    * definitions in order to add widgets to them. Additionally it is possible that widgets expose widget
    * areas themselves. In that case the name given within the widget template is prefixed with the id of the
    * widget instance, separated by a dot. If, within a widget, a name is dynamic (i.e. can be configured via
    * feature configuration), the corresponding `ax-widget-area-binding` attribute can be set to bind a name.
    *
    * Example:
    * ```html
    * <div ax-widget-area="myArea"><!-- Here will be widgets --></div>
    * ```
    *
    * Example with binding:
    * ```html
    * <div ax-widget-area
    *      ax-widget-area-binding="features.content.areaName">
    *    <!-- Here will be widgets -->
    * </div>
    * ```
    *
    * @name axWidgetArea
    * @directive
    */
   module.directive( DIRECTIVE_NAME, [ 'axPageService', function( pageService ) {
      return {
         restrict: 'A',
         link: function( scope, element, attrs ) {

            var widgetId = scope.widget && scope.widget.id;
            var areaName = attrs[ DIRECTIVE_NAME ];
            if( !areaName ) {
               if( attrs[ DIRECTIVE_NAME + 'Binding' ] ) {
                  areaName = scope.$eval( attrs[ DIRECTIVE_NAME + 'Binding' ] );
               }
               else {
                  var message = 'axWidgetArea: area at at [0] has neither a name nor a binding assigned.';
                  var context = widgetId || scope.layoutClass;
                  throw new Error( string.format( message, [ context ] ) );
               }
            }

            if( widgetId ) {
               // If a widget is found in a parent scope, this area must be an area contained in that widget.
               // Therefore the areaName is prefixed with the id of that widget.
               areaName = widgetId + '.' + areaName;
            }

            var areasController = pageService.controllerForScope( scope ).areas;
            var deregister = areasController.register( areaName, element[ 0 ] );
            scope.$on( '$destroy', deregister );
         }
      };
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/directives/directives',[
   './id/id',
   './layout/layout',
   './widget_area/widget_area'
], function( idModule, layoutModule, widgetAreaModule,pageFadeModule  ) {
   'use strict';

   return {
      id: idModule,
      layout: layoutModule,
      widgetArea: widgetAreaModule,
      pageFade: pageFadeModule
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Utilities for dealing with internationalization (i18n).
 *
 * When requiring `laxar`, it is available as `laxar.i18n`.
 *
 * @module i18n
 */
define( 'laxar/lib/i18n/i18n',[
   '../utilities/string',
   '../utilities/assert',
   '../utilities/configuration'
], function( string, assert, configuration ) {
   'use strict';

   var localize = localizeRelaxed;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var primitives = {
      string: true,
      number: true,
      boolean: true
   };

   var fallbackTag;

   var normalize = memoize( function( languageTag ) {
      return languageTag.toLowerCase().replace( /[-]/g, '_' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Shortcuts: it is assumed that this module is used heavily (or not at all).
   var format = string.format;
   var keys = Object.keys;

   return {
      localize: localize,
      localizeStrict: localizeStrict,
      localizeRelaxed: localizeRelaxed,
      localizer: localizer,
      languageTagFromI18n: languageTagFromI18n
   };

   /**
    * Shortcut to {@link localizeRelaxed}.
    *
    * @name localize
    * @type {Function}
    */

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Localize the given internationalized object using the given languageTag.
    *
    * @param {String} languageTag
    *    the languageTag to lookup a localization with. Maybe `undefined`, if the value is not i18n (app does
    *    not use i18n)
    * @param {*} i18nValue
    *    a possibly internationalized value:
    *    - when passing a primitive value, it is returned as-is
    *    - when passing an object, the languageTag is used as a key within that object
    * @param {*} [optionalFallback]
    *    a value to use if no localization is available for the given language tag
    *
    * @return {*}
    *    the localized value if found, `undefined` otherwise
    */
   function localizeStrict( languageTag, i18nValue, optionalFallback ) {
      assert( languageTag ).hasType( String );
      if( !i18nValue || primitives[ typeof i18nValue ] ) {
         // Value is not i18n
         return i18nValue;
      }
      assert( languageTag ).isNotNull();

      // Try one direct lookup before scanning the input keys,
      // assuming that language-tags are written in consistent style.
      var value = i18nValue[ languageTag ];
      if( value !== undefined ) {
         return value;
      }

      var lookupKey = normalize( languageTag );
      var availableTags = keys( i18nValue );
      var n = availableTags.length;
      for( var i = 0; i < n; ++i ) {
         var t = availableTags[ i ];
         if( normalize( t ) === lookupKey ) {
            return i18nValue[ t ];
         }
      }

      return optionalFallback;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * For controls (such as a date-picker), we cannot anticipate all required language tags, as they may be
    * app-specific. The relaxed localize behaves like localize if an exact localization is available. If not,
    * the language tag is successively generalized by stripping off the rightmost sub-tags until a
    * localization is found. Eventually, a fallback ('en') is used.
    *
    * @param {String} languageTag
    *    the languageTag to lookup a localization with. Maybe `undefined`, if the value is not i18n (app does
    *    not use i18n)
    * @param {*} i18nValue
    *    a possibly internationalized value:
    *    - when passing a primitive value, it is returned as-is
    *    - when passing an object, the `languageTag` is used to look up a localization within that object
    * @param {*} [optionalFallback]
    *    a value to use if no localization is available for the given language tag
    *
    * @return {*}
    *    the localized value if found, the fallback `undefined` otherwise
    */
   function localizeRelaxed( languageTag, i18nValue, optionalFallback ) {
      assert( languageTag ).hasType( String );
      if( !i18nValue || primitives[ typeof i18nValue ] ) {
         // Value is not i18n (app does not use it)
         return i18nValue;
      }

      var tagParts = languageTag ? languageTag.replace( /-/g, '_' ).split( '_' ) : [];
      while( tagParts.length > 0 ) {
         var currentLocaleTag = tagParts.join( '-' );
         var value = localizeStrict( currentLocaleTag, i18nValue );
         if( value !== undefined ) {
            return value;
         }
         tagParts.pop();
      }

      if( fallbackTag === undefined ) {
         fallbackTag = configuration.get( 'i18n.fallback', 'en' );
      }

      return ( fallbackTag && localizeStrict( fallbackTag, i18nValue ) ) || optionalFallback;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Encapsulate a given languageTag in a partially applied localize function.
    *
    * @param {String} languageTag
    *    the languageTag to lookup localizations with
    * @param {*} [optionalFallback]
    *    a value to use by the localizer function whenever no localization is available for the language tag
    *
    * @return {Localizer}
    *    A single-arg localize-Function, which always uses the given language-tag. It also has a `.format`
    *    -method, which can be used as a shortcut to `string.format( localize( x ), args )`
    */
   function localizer( languageTag, optionalFallback ) {

      /**
       * @name Localizer
       * @private
       */
      function partial( i18nValue ) {
         return localize( languageTag, i18nValue, optionalFallback );
      }

      /**
       * Shortcut to string.format, for simple chaining to the localizer.
       *
       * These are equal:
       * - `string.format( i18n.localizer( tag )( i18nValue ), numericArgs, namedArgs )`
       * - `i18n.localizer( tag ).format( i18nValue, numericArgs, namedArgs )`.
       *
       * @param {String} i18nValue
       *    the value to localize and then format
       * @param {Array} [optionalIndexedReplacements]
       *    replacements for any numeric placeholders in the localized value
       * @param {Object} [optionalNamedReplacements]
       *    replacements for any named placeholders in the localized value
       *
       * @return {String}
       *    the formatted string, taking i18n into account
       *
       * @memberOf Localizer
       */
      partial.format = function( i18nValue, optionalIndexedReplacements, optionalNamedReplacements ) {
         var formatString = localize( languageTag, i18nValue );
         if( formatString === undefined ) {
            return optionalFallback;
         }
         return format( formatString, optionalIndexedReplacements, optionalNamedReplacements );
      };

      return partial;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Retrieve the language tag of the current locale from an i18n model object, such as used on the scope.
    *
    * @param {{locale: String, tags: Object<String, String>}} i18n
    *    an internationalization model, with reference to the currently active locale and a map from locales
    *    to language tags
    * @param {*} [optionalFallbackLanguageTag]
    *    a language tag to use if no tags are found on the given object
    *
    * @return {String}
    *    the localized value if found, `undefined` otherwise
    */
   function languageTagFromI18n( i18n, optionalFallbackLanguageTag ) {
      if( !i18n || !i18n.hasOwnProperty( 'tags' ) ) {
         return optionalFallbackLanguageTag;
      }
      return i18n.tags[ i18n.locale ] || optionalFallbackLanguageTag;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function memoize( f ) {
      var cache = {};
      return function( key ) {
         var value = cache[ key ];
         if( value === undefined ) {
            value = f( key );
            cache[ key ] = value;
         }
         return value;
      };
   }

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Utilities for dealing with functions.
 *
 * When requiring `laxar`, it is available as `laxar.fn`.
 *
 * @module fn
 */
define( 'laxar/lib/utilities/fn',[], function() {
   'use strict';

   return {

      /**
       * [Underscore `debounce`](http://underscorejs.org/#debounce), but with LaxarJS offering mocking in
       * tests. See [http://underscorejs.org/#debounce](http://underscorejs.org/#debounce) for detailed
       * documentation.
       *
       * @param {Function} f
       *    the function to return a debounced version of
       * @param {Number} waitMs
       *    milliseconds to debounce before invoking `f`
       * @param {Boolean} immediate
       *    if `true` `f` is invoked prior to start waiting `waitMs` milliseconds. Otherwise `f` is invoked
       *    after the given debounce duration has passed. Default is `false`
       *
       * @return {Function}
       *    the debounced function
       */
      debounce: function( f, waitMs, immediate ) {
         var timeout, args, context, timestamp, result;
         return function() {
            context = this;
            args = arguments;
            timestamp = new Date();
            var later = function() {
               var last = (new Date()) - timestamp;
               if( last < waitMs ) {
                  timeout = setTimeout(later, waitMs - last);
               }
               else {
                  timeout = null;
                  if( !immediate ) {
                     result = f.apply(context, args);
                  }
               }
            };
            var callNow = immediate && !timeout;
            if( !timeout ) { timeout = setTimeout(later, waitMs); }
            if( callNow ) { result = f.apply(context, args); }
            return result;
         };
      }
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Provides a convenient api over the browser's `window.localStorage` and `window.sessionStorage` objects. If
 * a browser doesn't support [web storage](http://www.w3.org/TR/webstorage/), a warning is logged to the
 * `console` (if available) and a non-persistent in-memory store will be used instead. Note that this can for
 * example also happen when using Mozilla Firefox with cookies disabled and as such isn't limited to older
 * browsers.
 *
 * Additionally, in contrast to plain *web storage* access, non-string values will be automatically passed
 * through JSON (de-) serialization on storage or retrieval. All keys will be prepended with a combination of
 * an arbitrary and a configured namespace to prevent naming clashes with other web applications running on
 * the same host and port. All {@link StorageApi} accessor methods should then be called without any namespace
 * since adding and removing it, is done automatically.
 *
 * When requiring `laxar`, it is available as `laxar.storage`.
 *
 * @module storage
 */
define( 'laxar/lib/utilities/storage',[
   './assert',
   './configuration'
], function( assert, configuration ) {
   'use strict';

   var SESSION = 'sessionStorage';
   var LOCAL = 'localStorage';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * @param {Object} backend
    *    the K/V store, probably only accepting string values
    * @param {String} namespace
    *    prefix for all keys for namespacing purposes
    *
    * @return {StorageApi}
    *    a storage wrapper to the given backend with `getItem`, `setItem` and `removeItem` methods
    *
    * @private
    */
   function createStorage( backend, namespace ) {

      /**
       * The api returned by one of the `get*Storage` functions of the *storage* module.
       *
       * @name StorageApi
       * @constructor
       */
      return {
         getItem: getItem,
         setItem: setItem,
         removeItem: removeItem
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Retrieves a `value` by `key` from the store. JSON deserialization will automatically be applied.
       *
       * @param {String} key
       *    the key of the item to retrieve (without namespace prefix)
       *
       * @return {*}
       *    the value or `null` if it doesn't exist in the store
       *
       * @memberOf StorageApi
       */
      function getItem( key ) {
         var item = backend.getItem( namespace + '.' + key );
         return item ? JSON.parse( item ) : item;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Sets a `value` for a `key`. The value should be JSON serializable. An existing value will be
       * overwritten.
       *
       * @param {String} key
       *    the key of the item to set (without namespace prefix)
       * @param {*} value
       *    the new value to set
       *
       * @memberOf StorageApi
       */
      function setItem( key, value ) {
         var nsKey = namespace + '.' + key;
         if( value === undefined ) {
            backend.removeItem( nsKey );
         }
         else {
            backend.setItem( nsKey, JSON.stringify( value ) );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Removes the value associated with `key` from the store.
       *
       * @param {String} key
       *    the key of the item to remove (without namespace prefix)
       *
       * @memberOf StorageApi
       */
      function removeItem( key ) {
         backend.removeItem( namespace + '.' + key );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getOrFakeBackend( webStorageName ) {
      var store = window[ webStorageName ];
      if( store.setItem && store.getItem && store.removeItem ) {
         try {
            var testKey = 'ax.storage.testItem';
            // In iOS Safari Private Browsing, this will fail:
            store.setItem( testKey, 1 );
            store.removeItem( testKey );
            return store;
         }
         catch( e ) {
            // setItem failed: must use fake storage
         }
      }

      if( window.console ) {
         var method = 'warn' in window.console ? 'warn' : 'log';
         window.console[ method ](
            'window.' + webStorageName + ' not available: Using non-persistent polyfill. \n' +
            'Try disabling private browsing or enabling cookies.'
         );
      }

      var backend = {};
      return {
         getItem: function( key ) {
            return backend[ key ] || null;
         },
         setItem: function( key, val ) {
            backend[ key ] = val;
         },
         removeItem: function( key ) {
            if( key in backend ) {
               delete backend[ key ];
            }
         }
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function generateUniquePrefix() {
      var prefix = configuration.get( 'storagePrefix' );
      if( prefix ) {
         return prefix;
      }

      var str = configuration.get( 'name', '' );
      var res = 0;
      /* jshint bitwise:false */
      for( var i = str.length - 1; i > 0; --i ) {
         res = ((res << 5) - res) + str.charCodeAt( i );
         res |= 0;
      }
      return Math.abs( res );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a new storage module. In most cases this module will be called without arguments,
    * but having the ability to provide them is useful e.g. for mocking purposes within tests.
    * If the arguments are omitted, an attempt is made to access the native browser WebStorage api.
    * If that fails, storage is only mocked by an in memory map (thus actually unavailable).
    *
    * Developers are free to use polyfills to support cases where local- or session-storage may not be
    * available. Just make sure to initialize the polyfills before this module.
    *
    * @param {Object} [localStorageBackend]
    *    the backend for local storage, Default is `window.localStorage`
    * @param {Object} [sessionStorageBackend]
    *    the backend for session storage, Default is `window.sessionStorage`
    *
    * @return {Object}
    *    a new storage module
    */
   function create( localStorageBackend, sessionStorageBackend ) {

      var localBackend = localStorageBackend || getOrFakeBackend( LOCAL );
      var sessionBackend = sessionStorageBackend || getOrFakeBackend( SESSION );
      var prefix = 'ax.' + generateUniquePrefix() + '.';

      return {

         /**
          * Returns a local storage object for a specific local namespace.
          *
          * @param {String} namespace
          *    the namespace to prepend to keys
          *
          * @return {StorageApi}
          *    the local storage object
          */
         getLocalStorage: function( namespace ) {
            assert( namespace ).hasType( String ).isNotNull();

            return createStorage( localBackend, prefix + namespace );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Returns a session storage object for a specific local namespace.
          *
          * @param {String} namespace
          *    the namespace to prepend to keys
          *
          * @return {StorageApi}
          *    the session storage object
          */
         getSessionStorage: function( namespace ) {
            assert( namespace ).hasType( String ).isNotNull();

            return createStorage( sessionBackend, prefix + namespace );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Returns the local storage object for application scoped keys. This is equivalent to
          * `storage.getLocalStorage( 'app' )`.
          *
          * @return {StorageApi}
          *    the application local storage object
          */
         getApplicationLocalStorage: function() {
            return createStorage( localBackend, prefix + 'app' );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Returns the session storage object for application scoped keys. This is equivalent to
          * `storage.getSessionStorage( 'app' )`.
          *
          * @return {StorageApi}
          *    the application session storage object
          */
         getApplicationSessionStorage: function() {
            return createStorage( sessionBackend, prefix + 'app' );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         create: create

      };

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return create();

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/utilities/path',[
   './assert'
], function( assert ) {
   'use strict';

   var PATH_SEPARATOR = '/';
   var PARENT = '..';
   var ABSOLUTE = /^([a-z0-9]+:\/\/[^\/]+\/|\/)(.*)$/;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Joins multiple path fragments into one normalized path. Absolute paths (paths starting with a `/`)
    * and URLs will "override" any preceding paths. I.e. joining a URL or an absolute path to _anything_
    * will give the URL or absolute path.
    *
    * @param {...String} fragments
    *    the path fragments to join
    *
    * @return {String}
    *    the joined path
    */
   function join( /* firstFragment, secondFragment, ... */ ) {
      var fragments = Array.prototype.slice.call( arguments, 0 );
      if( fragments.length === 0 ) {
         return '';
      }

      var prefix = '';

      fragments = fragments.reduce( function( fragments, fragment ) {
         assert( fragment ).hasType( String ).isNotNull();

         var matchAbsolute = ABSOLUTE.exec( fragment );

         if( matchAbsolute ) {
            prefix = matchAbsolute[1];
            fragment = matchAbsolute[2];
            return fragment.split( PATH_SEPARATOR );
         }

         return fragments.concat( fragment.split( PATH_SEPARATOR ) );
      }, [] );

      var pathStack = normalizeFragments( fragments );

      return prefix + pathStack.join( PATH_SEPARATOR );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Normalizes a path. Removes multiple consecutive slashes, strips trailing slashes, removes `.`
    * references and resolves `..` references (unless there are no preceding directories).
    *
    * @param {String} path
    *    the path to normalize
    *
    * @return {String}
    *    the normalized path
    */
   function normalize( path ) {
      var prefix = '';
      var matchAbsolute = ABSOLUTE.exec( path );

      if( matchAbsolute ) {
         prefix = matchAbsolute[1];
         path = matchAbsolute[2];
      }

      var pathStack = normalizeFragments( path.split( PATH_SEPARATOR ) );

      return prefix + pathStack.join( PATH_SEPARATOR );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Compute a relative path. Takes two absolute paths and returns a normalized path, relative to
    * the first path.
    * Note that if both paths are URLs they are threated as if they were on the same host. I.e. this function
    * does not complain when called with `http://localhost/path` and `http://example.com/another/path`.
    *
    * @param {String} from
    *    the starting point from which to determine the relative path
    *
    * @param {String} path
    *    the target path
    *
    * @return {String}
    *    the relative path from `from` to `to`
    */
   function relative( from, path ) {
      var matchAbsoluteFrom = ABSOLUTE.exec( from );
      var matchAbsolutePath = ABSOLUTE.exec( path );

      assert( matchAbsoluteFrom ).isNotNull();
      assert( matchAbsolutePath ).isNotNull();

      var fromStack = normalizeFragments( matchAbsoluteFrom[2].split( PATH_SEPARATOR ) );
      var pathStack = normalizeFragments( matchAbsolutePath[2].split( PATH_SEPARATOR ) );

      return fromStack.reduce( function( path, fragment ) {
         if( path[0] === fragment ) {
            path.shift();
         } else {
            path.unshift( '..' );
         }
         return path;
      }, pathStack ).join( PATH_SEPARATOR ) || '.';
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function normalizeFragments( fragments ) {
      return fragments.reduce( function( pathStack, fragment ) {
         fragment = fragment.replace( /^\/+|\/+$/g, '' );

         if( fragment === '' || fragment === '.' ) {
            return pathStack;
         }

         if( pathStack.length === 0 ) {
            return [ fragment ];
         }

         if( fragment === PARENT && pathStack.length > 0 && pathStack[ pathStack.length - 1 ] !== PARENT ) {
            pathStack.pop();
            return pathStack;
         }
         pathStack.push( fragment );

         return pathStack;
      }, [] );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      join: join,
      normalize: normalize,
      relative: relative
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/loaders/paths',[
   'require'
], function( require ) {
   'use strict';

   return {
      PRODUCT: require.toUrl( 'laxar-path-root' ),
      THEMES: require.toUrl( 'laxar-path-themes' ),
      LAYOUTS: require.toUrl( 'laxar-path-layouts' ),
      WIDGETS: require.toUrl( 'laxar-path-widgets' ),
      PAGES: require.toUrl( 'laxar-path-pages' ),
      FLOW_JSON: require.toUrl( 'laxar-path-flow' ),
      DEFAULT_THEME: require.toUrl( 'laxar-path-default-theme' )
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/runtime/runtime',[
   'angular',
   '../utilities/path',
   '../loaders/paths'
], function( ng, path, paths ) {
   'use strict';

   var module = ng.module( 'axRuntime', [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Patching AngularJS with more aggressive scope destruction and memory leak prevention
   module.run( [ '$rootScope', '$window', function( $rootScope, $window ) {
      ng.element( $window ).one( 'unload', function() {
         while( $rootScope.$$childHead ) {
            $rootScope.$$childHead.$destroy();
         }
         $rootScope.$destroy();
      } );
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Initialize the theme manager
   module.run( [ 'axCssLoader', 'axThemeManager', function( CssLoader, themeManager ) {
      themeManager
         .urlProvider( path.join( paths.THEMES, '[theme]' ), null, paths.DEFAULT_THEME )
         .provide( [ 'css/theme.css' ] )
         .then( function( files ) {
            CssLoader.load( files[0] );
         } );
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Initialize i18n for i18n controls in non-i18n widgets
   module.run( [ '$rootScope', 'axConfiguration', function( $rootScope, configuration ) {
      $rootScope.i18n = {
         locale: 'default',
         tags: configuration.get( 'i18n.locales', { 'default': 'en' } )
      };
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * The *event_bus* module contains the implementation of the *LaxarJS EventBus*. In an application you'll
 * never use this module or instantiate an event bus instance directly. Instead within a widget the event bus
 * can be injected via service or accessed as property on the AngularJS `$scope` or `axContext` injections.
 *
 * @module event_bus
 */
define( 'laxar/lib/event_bus/event_bus',[
   '../utilities/assert',
   '../utilities/object',
   '../logging/log'
], function( assert, object, log ) {
   'use strict';

   var q_;
   var nextTick_;
   var timeoutFunction_;

   var WILDCARD = '*';
   var SUBSCRIBER_FIELD = '.';
   var INTERNAL_EVENTS_REGISTRY = 'ax__events';

   var PART_SEPARATOR = '.';
   var SUB_PART_SEPARATOR = '-';
   var REQUEST_MATCHER = /^([^.])([^.]*)Request(\..+)?$/;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Constructor for an event bus.
    *
    * @param {Object} [optionalConfiguration]
    *    configuration for the event bus instance
    * @param {Number} optionalConfiguration.pendingDidTimeout
    *    the timeout in milliseconds used by {@link EventBus#publishAndGatherReplies}. Default is 120000ms
    *
    * @constructor
    * @private
    */
   function EventBus( optionalConfiguration ) {
      this.config_ = object.options( optionalConfiguration, {
         pendingDidTimeout: 120000
      } );

      this.cycleCounter_ = 0;
      this.eventQueue_ = [];
      this.subscriberTree_ = {};

      this.waitingDeferreds_ = [];
      this.currentCycle_ = -1;
      this.errorHandler_ = defaultErrorHandler;
      this.mediator_ = ensureFunction();
      this.inspectors_ = [];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets a handler for all errors that may occur during event processing. It receives an error message as
    * first argument and a map with additional information on the problem as second argument. There may be
    * instances of `Error` as values within the map.
    * The default error handler simply logs all issues to `console.error` or `console.log` if available.
    *
    * @param {Function} errorHandler
    *    the error handler
    */
   EventBus.prototype.setErrorHandler = function( errorHandler ) {
      this.errorHandler_ = ensureFunction( errorHandler, defaultErrorHandler );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets a mediator, that has the chance to alter events shortly before their delivery to the according
    * subscribers. Its sole argument is the complete list of queued event items that should be delivered
    * during the current JavaScript event loop. It then needs to return this list, including optional
    * modifications, again. Event items may be added or deleted at will, but the return type needs to be an
    * array containing zero or more event item-like objects.
    *
    * An event item has these properties:
    * - `meta`: map with meta information for this event
    *   - `name`: full name of the published event
    *   - `cycleId`: the id of the cycle the event was published in
    *   - `sender`: name of sender (if available)
    *   - `initiator`: name of the sender initiating the current event cycle (if available)
    *   - `options`: map of options given when publishing the event
    * - `event`: the event payload it self as published by the sender
    *
    * @param {Function} mediator
    *    the mediator function
    */
   EventBus.prototype.setMediator = function( mediator ) {
      this.mediator_ = ensureFunction( mediator );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Adds an inspector, that gets notified when certain actions within the event bus take place. Currently
    * these actions may occur:
    *
    * - `subscribe`: a new subscriber registered for an event
    * - `publish`: an event is published but not yet delivered
    * - `deliver`: an event is actually delivered to a subscriber
    *
    * An inspector receives a map with the following properties:
    *
    * - `action`: one of the actions from above
    * - `source`: the origin of the `action`
    * - `target`: the name of the event subscriber (`deliver` action only)
    * - `event`: the full name of the event or the subscribed event (`subscribe` action only)
    * - `eventObject`: the published event item (`publish` action only)
    * - `subscribedTo`: the event, possibly with omissions, the subscriber subscribed to (`deliver` action only)
    * - `cycleId`: the id of the event cycle
    *
    * The function returned by this method can be called to remove the inspector again and prevent it from
    * being called for future event bus actions.
    *
    * @param {Function} inspector
    *    the inspector function to add
    *
    * @return {Function}
    *    a function to remove the inspector
    */
   EventBus.prototype.addInspector = function( inspector ) {
      assert( inspector ).hasType( Function ).isNotNull();

      this.inspectors_.push( inspector );
      return function() {
         var index = this.inspectors_.indexOf( inspector );
         if( index !== -1 ) {
            this.inspectors_.splice( index, 1 );
         }
      }.bind( this );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Subscribes to an event by name. An event name consists of so called *topics*, where each topic is
    * separated from another by dots (`.`). If a topic is omitted, this is treated as a wildcard. Note that
    * two dots in the middle or one dot at the beginning of an event name must remain, whereas a dot at the
    * end may be omitted. As such every event name has an intrinsic wildcard at its end. For example these are
    * all valid event names:
    *
    * - `some.event`: matches `some.event`, `some.event.again`
    * - `.event`: matches `some.event`, `any.event`, `any.event.again`
    * - `some..event`: matches `some.fancy.event`, `some.special.event`
    *
    * Additionally *subtopics* are supported. A subtopic are fragments of a topic, separated from another by
    * simple dashes (`-`). Here only suffixes of subtopics may be omitted when subscribing. Thus subscribing
    * to `some.event` would match an event published with name `some.event-again` or even
    * `some.event-another.again`.
    *
    * When an event is delivered, the subscriber function receives two arguments:
    * The first one is the event object as it was published. If `clone` yields `true` this is a simple deep
    * copy of the object (note that only properties passing a JSON-(de)serialization remain). If `false` the
    * object is frozen using `Object.freeze` recursively in browsers that support freezing. In any other
    * browser this is just an identity operation.
    *
    * The second one is a meta object with these properties:
    *
    * - `unsubscribe`: A function to directly unsubscribe the called subscriber from further events
    * - `name`: The name of the event as it actually was published (i.e. without wildcards).
    * - `cycleId`: The id of the cycle the event was published (and delivered) in
    * - `sender`: The id of the event sender, may be `null`.
    * - `initiator`: The id of the initiator of the cycle. Currently not implemented, thus always `null`.
    * - `options`: The options that were passed to `publish` or `publishAndGatherReplies` respectively.
    *
    * Note that the subscriber function will receive a property `ax__events` to keep track of all events this
    * function was attached to. This is necessary to make {@link EventBus#unsubscribe} work.
    *
    * @param {String} eventName
    *    the name of the event to subscribe to
    * @param {Function} subscriber
    *    a function to call whenever an event matching `eventName` is published
    * @param {Object} [optionalOptions]
    *    additional options for the subscribe action
    * @param {String} optionalOptions.subscriber
    *    the id of the subscriber. Default is `null`
    * @param {Boolean} optionalOptions.clone
    *    if `false` the event will be send frozen to the subscriber, otherwise it will receive a deep copy.
    *    Default is `true`
    */
   EventBus.prototype.subscribe = function( eventName, subscriber, optionalOptions ) {
      assert( eventName ).hasType( String ).isNotNull();
      assert( subscriber ).hasType( Function ).isNotNull();

      var options = object.options( optionalOptions, {
         subscriber: null,
         clone: true
      } );
      var subscriberItem = {
         name: eventName,
         subscriber: subscriber,
         subscriberName: options.subscriber,
         subscriptionWeight: calculateSubscriptionWeight( eventName ),
         options: options
      };

      var parts = eventName.split( PART_SEPARATOR );
      var node = this.subscriberTree_;
      for( var i = 0; i < parts.length; ++i ) {
         var bucketName = parts[i].length ? parts[i] : WILDCARD;
         if( !( bucketName in node ) ) {
            node[ bucketName ] = {};
         }
         node = node[ bucketName ];
      }

      if( !( SUBSCRIBER_FIELD in node ) ) {
         node[ SUBSCRIBER_FIELD ] = [];
      }
      node[ SUBSCRIBER_FIELD ].push( subscriberItem );

      if( !subscriber.hasOwnProperty( INTERNAL_EVENTS_REGISTRY ) ) {
         subscriber[ INTERNAL_EVENTS_REGISTRY ] = [];
      }
      subscriber[ INTERNAL_EVENTS_REGISTRY ].push( eventName );

      notifyInspectors( this, {
         action: 'subscribe',
         source: options.subscriber,
         target: '-',
         event: eventName,
         cycleId: this.currentCycle_
      } );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Removes all subscriptions of the given subscriber.
    *
    * @param {Function} subscriber
    *    the function to unsubscribe
    */
   EventBus.prototype.unsubscribe = function( subscriber ) {
      assert( subscriber ).hasType( Function ).isNotNull();

      if( !subscriber.hasOwnProperty( INTERNAL_EVENTS_REGISTRY ) ||
          !Array.isArray( subscriber[ INTERNAL_EVENTS_REGISTRY ] ) ) {
         return;
      }

      var self = this;
      var subscriberTree = this.subscriberTree_;
      subscriber[ INTERNAL_EVENTS_REGISTRY ].forEach( function( eventName ) {
         unsubscribeRecursively( self, subscriberTree, eventName.split( PART_SEPARATOR ), subscriber );
      } );

      delete subscriber[ INTERNAL_EVENTS_REGISTRY ];
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function unsubscribeRecursively( self, node, parts, subscriber ) {
      if( parts.length === 0 && Array.isArray( node[ SUBSCRIBER_FIELD ] ) ) {
         var subscribers = node[ SUBSCRIBER_FIELD ];
         for( var i = subscribers.length -1; i >= 0; --i ) {
            if( subscribers[i].subscriber === subscriber ) {
               notifyInspectors( self, {
                  action: 'unsubscribe',
                  source: subscribers[i].subscriberName,
                  target: '-',
                  event: subscribers[i].name,
                  cycleId: self.currentCycle_
               } );
               subscribers.splice( i, 1 );
            }
         }
      }

      var part = parts.shift();
      if( part === '' ) {
         part = WILDCARD;
      }
      if( part in node ) {
         unsubscribeRecursively( self, node[ part ], parts, subscriber );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Asynchronously publishes an event on the event bus. The returned promise will be queued as soon as this
    * event is delivered and, if during delivery a new event was enqueued, resolved after that new event was
    * delivered. If no new event is queued during delivery of this event, the promise is instantly resolved.
    * To make this a bit clearer, lets assume we publish and thus enqueue an event at time `t`. It then will
    * be delivered at time `t+1`. At that precise moment the promise is enqueued to be resolved soon. We then
    * distinguish between two cases:
    *
    * - At time `t+1` no subscriber publishes (i.e. enqueues) an event: Thus there is no event in the same
    *   cycle and the promise is also resolved at time `t+1`.
    * - At least one subscriber publishes an event at time `t+1`: The promise is then scheduled to be resolved
    *   as soon as this event is delivered at time `t+2`.
    *
    * The implication of this is the following:
    *
    * We have two collaborators, A and B. A listens to event b and B listens to event a.
    * Whenever A publishes a and B than instantly (i.e. in the same event cycle of the JavaScript runtime
    * where its subscriber function was called) *responds* by publishing b, b arrives at the subscriber
    * function of A, before the promise of A's publish action is resolved.
    * It is hence possible to observe possible effects of an event sent by oneself, under the conditions
    * mentioned above. Practically this is used internally for the implementation of
    * {@link EventBus#publishAndGatherReplies}.
    *
    * @param {String} eventName
    *    the name of the event to publish
    * @param {Object} [optionalEvent]
    *    the event to publish
    * @param {Object} [optionalOptions]
    *    additional options for the publish action
    * @param {String} optionalOptions.sender
    *    the id of the event sender. Default is `null`
    * @param {Boolean} optionalOptions.deliverToSender
    *    if `false` the event will not be send to subscribers whose subscriber name matches
    *    `optionalOptions.sender`, else all subscribers will receive the event. Default is `true`
    *
    * @return {Promise}
     *   the delivery promise
    */
   EventBus.prototype.publish = function( eventName, optionalEvent, optionalOptions ) {
      assert( eventName ).hasType( String ).isNotNull();

      var event = JSON.parse( JSON.stringify( optionalEvent || {} ) );
      var options = object.options( optionalOptions, {
         deliverToSender: true,
         sender: event.sender || null
      } );

      if( event.sender ) {
         log.warn( 'Deprecation warning: The event sender should be set in the options, not the event itself.\n' +
            'Sender: [0], Eventname: [1]', event.sender, eventName );
      }

      var eventItem = {
         meta: {
            name: eventName,
            cycleId: this.currentCycle_ > -1 ? this.currentCycle_ : this.cycleCounter_++,
            sender: options.sender,
            initiator: null,
            options: options
         },
         event: event,
         publishedDeferred: q_.defer()
      };
      enqueueEvent( this, eventItem );

      notifyInspectors( this, {
         action: 'publish',
         source: options.sender,
         target: '-',
         event: eventName,
         eventObject: event,
         cycleId: eventItem.meta.cycleId
      } );

      return eventItem.publishedDeferred.promise;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Publishes an event that follows the *request-will-did pattern* and awaits all replies. This pattern has
    * evolved over time and is of great use when handling the asynchronous nature of event bus events.
    *
    * Certain rules need to be fulfilled: First the initiator needs to call this method with an event whose
    * name has the suffix `Request`, e.g. `takeActionRequest`. All collaborators that want to react to this
    * event then either do so in the same event cycle by sending a `didTakeAction` event or announce that they
    * will do something asynchronously by publishing a `willTakeAction` event. In the latter case they need to
    * broadcast the fulfillment of their action by sending a `didTakeAction` event. Note that for both events
    * the same sender name needs to be given. Otherwise they cannot be mapped and the event bus doesn't know
    * if all asynchronous replies were already received.
    *
    * Additionally a timer is started using either the globally configured `pendingDidTimeout` ms value or the
    * value provided as option to this method. If that timer expires before all `did*` events to all given
    * `will*` events were received, the error handler is called to handle the incident and the promise is
    * rejected with all response received up to now.
    *
    * @param {String} eventName
    *    the name of the event to publish
    * @param {Object} [optionalEvent]
    *    the event to publish
    * @param {Object} [optionalOptions]
    *    additional options for the publish action
    * @param {String} optionalOptions.sender
    *    the id of the event sender. Default is `null`
    * @param {Number} optionalOptions.pendingDidTimeout
    *    the timeout in milliseconds for pending did* events
    *
    * @return {Promise}
    *   the delivery promise. It receives a list of all collected `did*` events and according meta information
    */
   EventBus.prototype.publishAndGatherReplies = function( eventName, optionalEvent, optionalOptions ) {
      assert( eventName ).hasType( String ).isNotNull();

      var matches = REQUEST_MATCHER.exec( eventName );
      assert.state( !!matches, 'Expected eventName to end with "Request" but got ' + eventName );

      var self = this;
      var options = object.options( optionalOptions, {
         pendingDidTimeout: this.config_.pendingDidTimeout
      } );

      var eventNameSuffix = matches[1].toUpperCase() + matches[2];
      if( matches[3] ) {
         eventNameSuffix += matches[3];
      }
      var deferred = q_.defer();
      var willWaitingForDid = [];
      var givenDidResponses = [];
      var cycleFinished = false;

      function willCollector( event, meta ) {
         assert( meta.sender ).hasType( String )
            .isNotNull( 'A response with will to a request-event must contain a sender.' );

         willWaitingForDid.push( meta.sender );
      }
      this.subscribe( 'will' + eventNameSuffix, willCollector, { subscriber: options.sender } );

      function didCollector( event, meta ) {
         givenDidResponses.push( { event: event, meta: meta } );

         var senderIndex = willWaitingForDid.indexOf( meta.sender );
         if( senderIndex !== -1 ) {
            willWaitingForDid.splice( senderIndex, 1 );
         }

         if( willWaitingForDid.length === 0 && cycleFinished ) {
            finish();
         }
      }
      this.subscribe( 'did' + eventNameSuffix, didCollector, { subscriber: options.sender } );

      var timeoutRef = timeoutFunction_( function() {
         if( willWaitingForDid.length > 0 ) {
            var message = 'Timeout while waiting for pending did' + eventNameSuffix + ' on ' + eventName + '.';
            self.errorHandler_( message, {
               'Sender': options.sender,
               'After ms timeout': options.pendingDidTimeout,
               'Responses missing from': willWaitingForDid.join( ', ' )
            } );
            finish( true );
         }
      }, options.pendingDidTimeout );

      this.publish( eventName, optionalEvent, options ).then( function() {
         if( willWaitingForDid.length === 0 ) {
            // either there was no will or all did responses were already given in the same cycle as the will
            finish();
            return;
         }

         cycleFinished = true;
      } );

      function finish( wasCanceled ) {
         clearTimeout( timeoutRef );
         self.unsubscribe( willCollector );
         self.unsubscribe( didCollector );
         ( wasCanceled ? deferred.reject : deferred.resolve )( givenDidResponses );
      }

      return deferred.promise;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function enqueueEvent( self, eventItem ) {
      if( self.eventQueue_.length === 0 ) {
         nextTick_( function() {
            var queuedEvents = self.eventQueue_;

            self.eventQueue_ = [];

            processWaitingDeferreds( self, processQueue( self, queuedEvents ) );
         } );
      }
      self.eventQueue_.push( eventItem );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processQueue( self, queuedEvents ) {
      return self.mediator_( queuedEvents ).map( function( eventItem ) {
         var meta = eventItem.meta;
         self.currentCycle_ = meta.cycleId;

         var subscribers = findSubscribers( self, meta.name );
         if( subscribers.length === 0 ) {
            self.currentCycle_ = -1;
            return eventItem.publishedDeferred;
         }

         var serializedEvent = null;
         if( subscribers.length > 1 ) {
            serializedEvent = JSON.stringify( eventItem.event );
         }

         var senderName = meta.sender;
         var options = meta.options;

         subscribers.forEach( function( subscriberItem ) {
            var subscriberName = subscriberItem.subscriberName;
            if( !options.deliverToSender && senderName && senderName === subscriberName ) {
               return;
            }

            try {
               var event;
               if( subscriberItem.options.clone ) {
                  event = serializedEvent ? JSON.parse( serializedEvent ) : eventItem.event;
               }
               else {
                  event = object.deepFreeze( eventItem.event, true );
               }
               subscriberItem.subscriber( event, object.options( meta, {
                  unsubscribe: function() {
                     self.unsubscribe( subscriberItem.subscriber );
                  }
               } ) );
            }
            catch( e ) {
               var message = 'error while calling subscriber "' + subscriberName + '"' +
                  ' for event ' + meta.name +
                  ' published by "' + senderName + '" (subscribed to: ' + subscriberItem.name + ')';
               self.errorHandler_( message, {
                  'Exception': e,
                  'Published event': eventItem.event,
                  'Event meta information': meta,
                  'Caused by Subscriber': subscriberItem
               } );
            }

            notifyInspectors( self, {
               action: 'deliver',
               source: senderName,
               target: subscriberName,
               event: meta.name,
               eventObject: eventItem.event,
               subscribedTo: subscriberItem.name,
               cycleId: meta.cycleId
            } );
         } );

         self.currentCycle_ = -1;

         return eventItem.publishedDeferred;
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processWaitingDeferreds( self, newDeferreds ) {
      var waitingDeferreds = self.waitingDeferreds_;
      self.waitingDeferreds_ = newDeferreds;

      waitingDeferreds.forEach( function( deferred ) {
         deferred.resolve();
      } );

      if( self.eventQueue_.length === 0 ) {
         // nothing was queued by any subscriber. The publishers can instantly be notified of delivery.
         newDeferreds.forEach( function( deferred ) {
            deferred.resolve();
         } );
         self.waitingDeferreds_ = [];
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function findSubscribers( self, eventName ) {
      var subscribers = [];
      var parts = eventName.split( PART_SEPARATOR );
      var node = self.subscriberTree_;

      findSubscribersRecursively( node, parts, subscribers );
      subscribers.sort( function( a, b ) {
         var aWeight = a.subscriptionWeight;
         var bWeight = b.subscriptionWeight;
         if( aWeight[0] === bWeight[0] ) {
            return bWeight[1] - aWeight[1];
         }

         return bWeight[0] - aWeight[0];
      } );

      return subscribers;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function findSubscribersRecursively( node, parts, subscribers ) {
      if( Array.isArray( node[ SUBSCRIBER_FIELD ] ) ) {
         subscribers.push.apply( subscribers, node[ SUBSCRIBER_FIELD ] );
      }

      if( parts.length === 0 ) {
         return;
      }

      var part = parts[ 0 ];
      parts = parts.slice( 1 );

      if( part.indexOf( SUB_PART_SEPARATOR ) !== -1 ) {
         var index = part.length;
         do {
            part = part.substring( 0, index );
            if( part in node ) {
               findSubscribersRecursively( node[ part ], parts, subscribers );
            }
            index = part.lastIndexOf( SUB_PART_SEPARATOR );
         }
         while( index !== -1 );
      }
      else if( part in node ) {
         findSubscribersRecursively( node[ part ], parts, subscribers );
      }

      if( WILDCARD in node ) {
         findSubscribersRecursively( node[ WILDCARD ], parts, subscribers );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function calculateSubscriptionWeight( eventName ) {
      var parts = eventName.split( PART_SEPARATOR );
      var weight = [ 0, 0 ];
      parts.forEach( function( part ) {
         if( part.length > 0 ) {
            weight[0]++;
            weight[1] += part.split( SUB_PART_SEPARATOR ).length - 1;
         }
      } );
      return weight;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function notifyInspectors( self, infoObject ) {
      self.inspectors_.forEach( function( inspector ) {
         inspector( infoObject );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function defaultErrorHandler( message, optionalErrorInformation ) {
      if( !window.console || !window.console.log ) {
         return;
      }

      var console = window.console;
      var errFunc = !!console.error ? 'error' : 'log';
      console[ errFunc ]( message );

      if( optionalErrorInformation ) {
         Object.keys( optionalErrorInformation ).forEach( function( title ) {
            var info = optionalErrorInformation[ title ];
            console[ errFunc ]( '   - %s: %o', title, info );
            if( info instanceof Error && info.stack ) {
               console[ errFunc ]( '   - Stacktrace: %s', info.stack );
            }
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function ensureFunction( candidate, fallback ) {
      return typeof candidate === 'function' ? candidate : ( fallback || function( _ ) { return  _; } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      /**
       * Creates and returns a new event bus instance using the given configuration.
       *
       * @param {Object} [optionalConfiguration]
       *    configuration for the event bus instance
       * @param {Number} optionalConfiguration.pendingDidTimeout
       *    the timeout in milliseconds used by {@link EventBus#publishAndGatherReplies}. Default is 120000ms
       *
       * @return {EventBus}
       */
      create: function( optionalConfiguration ) {
         assert( q_ ).isNotNull( 'Need a promise implementation like $q or Q' );
         assert( nextTick_ )
            .hasType( Function ).isNotNull( 'Need a next tick implementation like $timeout' );
         assert( timeoutFunction_ )
            .hasType( Function ).isNotNull( 'Need a timeout implementation like $timeout or setTimeout' );

         return new EventBus( optionalConfiguration );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Initializes the module.
       *
       * @param {Object} q
       *    a promise library like AngularJS' `$q`
       * @param {Function} nextTick
       *    a next tick function like `process.nextTick` or AngularJS' `$timeout`
       * @param {Function} timeoutFunction
       *    a timeout function like `window.setTimeout`  or AngularJS' `$timeout`
       */
      init: function( q, nextTick, timeoutFunction ) {
         q_ = q;
         nextTick_ = nextTick;
         timeoutFunction_ = timeoutFunction;
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * The *file_resource_provider* module defines a mechanism to load static assets from the web server of the
 * LaxarJS application efficiently. Whenever a file should be requested from the server, the file resource
 * provider should be used in favor of manual http requests, due to two reasons: During development it reduces
 * the amount of `404` status replies for files that may or may not exist, and when making a release build,
 * file contents may optionally be embedded in the build bundle. This makes further http requests redundant,
 * which is especially relevant in high-latency networks, such as cellular networks.
 *
 * This module should not be used directly, but via the `axFileResourceProvider` service provided by LaxarJS.
 *
 * @module file_resource_provider
 */
define( 'laxar/lib/file_resource_provider/file_resource_provider',[
   '../utilities/assert',
   '../utilities/string',
   '../utilities/path',
   '../utilities/configuration'
], function( assert, string, path, configuration ) {
   'use strict';

   var q_;
   var httpClient_;
   var BORDER_SLASHES_MATCHER = /^\/|\/$/g;
   var ENTRY_TYPE_FILE = 1;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * A provider for file resources that tries to minimize the amount of 404 errors when requesting files that
    * are not available. To achieve this it is backed by one or more directory tree mappings that already list
    * which files are available on the server. For any file being located at a path that is not supported by a
    * mapping, a HEAD request takes place, that might or might not result in a 404 error. If a file is
    * located at a path supported by a mapping, but is not found in that mapping (because it was added later),
    * it is assumed to be nonexistent.
    *
    * @param {String} rootPath
    *    the path to the root of the application. It is needed to prefix relative paths found in a listing
    *    with an absolute prefix
    *
    * @constructor
    * @private
    */
   function FileResourceProvider( rootPath ) {
      this.useEmbedded_ = configuration.get( 'useEmbeddedFileListings', false );
      this.rootPath_ = path.normalize( rootPath );
      this.fileListings_ = {};
      this.fileListingUris_ = {};

      this.httpGets_ = {};
      this.httpHeads_ = {};
      this.httpHeadCache_ = {};
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * If available, resolves the returned promise with the requested file's contents. Otherwise the promise is
    * rejected. It uses the file mapping prior to fetching the contents to prevent from 404 errors. In the
    * optimal case the contents are already embedded in the listing and simply need to be returned. If no
    * listing for the path is available, a request simply takes place and either succeeds or fails.
    *
    * @param {String} url
    *    the uri to the resource to provide
    *
    * @return {Promise}
    *    resolved with the file's content or rejected when the file could not be fetched
    */
   FileResourceProvider.prototype.provide = function( url ) {
      var self = this;
      return entry( this, url ).then( function( knownEntry ) {
         if( typeof( knownEntry ) === 'string' ) {
            return q_.when( knownEntry ).then( resourceTransform( url ) );
         }
         return knownEntry !== false ? httpGet( self, url ).then( resourceTransform( url ) ) : q_.reject();
      }, function() {
         return httpGet( self, url ).then( resourceTransform( url ) );
      } );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Resolves the returned promise with `true` as argument, if the requested resource is available and
    * `false` otherwise.  If no listing for the path is available, a HEAD request takes place and either
    * succeeds or fails.
    *
    * @param {String} url
    *    the uri to check for availability
    *
    * @return {Promise}
    *    a promise that is always resolved with a boolean value
    */
   FileResourceProvider.prototype.isAvailable = function isAvailable( url ) {
      var self = this;
      return entry( self, url ).then( function( knownEntry ) {
         return q_.when( knownEntry !== false );
      }, function() {
         return httpHead( self, url ).then( function( knownAvailable ) {
            return q_.when( knownAvailable );
         } );
     } );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets the uri to a file listing file for a given path.
    *
    * @param {String} directory
    *    the directory the file listing is valid for
    * @param {String} listingUri
    *    the uri to the listing file
    */
   FileResourceProvider.prototype.setFileListingUri = function( directory, listingUri ) {
      var filePathPrefix = path.join( this.rootPath_, directory );
      this.fileListingUris_[ filePathPrefix ] = path.join( this.rootPath_, listingUri );
      this.fileListings_[ filePathPrefix ] = null;
      fetchListingForPath( this, filePathPrefix );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets the contents of a file listing file to the given object. This a useful alternative to
    * {@link FileResourceProvider#setFileListingUri}, to avoid an additional round-trip during production.
    *
    * @param {String} directory
    *    the directory the file listing is valid for
    * @param {String} listing
    *    the actual file listing
    */
   FileResourceProvider.prototype.setFileListingContents = function( directory, listing ) {
      var filePathPrefix = path.join( this.rootPath_, directory );
      this.fileListingUris_[ filePathPrefix ] = '#';
      this.fileListings_[ filePathPrefix ] = listing;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Try to lookup a file resource in the provider's listings.
    *
    * @return {Promise}
    *    Resolves to `true` (listed but not embedded), to `false` (file is not listed), or to a string
    *    (embedded content for a listed file).
    *
    * @private
    */
   function entry( provider, resourcePath ) {
      var usablePrefixes = Object.keys( provider.fileListingUris_ ).filter( function( prefix ) {
         return resourcePath.indexOf( prefix ) === 0;
      } );

      if( usablePrefixes.length ) {
         var prefix = usablePrefixes[ 0 ];
         return fetchListingForPath( provider, prefix ).then( function( listing ) {
            return q_.when( lookup( provider, resourcePath, listing ) );
         } );
      }

      return q_.reject();

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function lookup( self, file, listing ) {
         var parts = file.replace( self.rootPath_, '' ).replace( BORDER_SLASHES_MATCHER, '' ).split( '/' );
         for( var i = 0, len = parts.length; i < len; ++i ) {
            if( i === len - 1 ) {
               var value = listing[ parts[ i ] ];
               if( self.useEmbedded_ ) {
                  return typeof( value ) === 'string' ? value : (value === ENTRY_TYPE_FILE);
               }
               else {
                  return typeof( value ) === 'string' || (value === ENTRY_TYPE_FILE);
               }
            }

            listing = listing[ parts[ i ] ];
            if( typeof listing !== 'object' ) {
               return false;
            }
         }
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function resourceTransform( path ) {
      return /\.json$/.test( path ) ?
         function( contents ) { return JSON.parse( contents ); } :
         function( contents ) { return contents; };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function fetchListingForPath( self, path ) {
      if( self.fileListings_[ path ] ) {
         return q_.when( self.fileListings_[ path ] );
      }

      var listingUri = self.fileListingUris_[ path ];
      return httpGet( self, listingUri )
         .then( resourceTransform( listingUri ) )
         .then( function( listing ) {
            self.fileListings_[ path ] = listing;
            return listing;
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * @param {FileResourceProvider} self
    * @param {String} url A url to get
    *
    * @return {Promise<String>} Resolved to the file contents if the request succeeds
    *
    * @private
    */
   function httpGet( self, url ) {
      if( url in self.httpGets_ ) {
         return self.httpGets_[ url ];
      }

      var promise = self.httpGets_[ url ] = httpClient_
         .get( url, { transformResponse: [] } )
         .then( function( response ) {
            return q_.when( response.data );
         } );

      // Free memory when the response is complete:
      promise.then( function() {
         delete self.httpGets_[ url ];
      } );

      return promise;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * @param {FileResourceProvider} self
    * @param {String} url A url to check using a HEAD request
    *
    * @return {Promise<Boolean>} Resolved to `true` if a HEAD-request to the url succeeds, else to `false`.
    *
    * @private
    */
   function httpHead( self, url ) {
      if( url in self.httpHeadCache_ ) {
         return q_.when( self.httpHeadCache_[ url ] );
      }
      if( url in self.httpHeads_ ) {
         return self.httpHeads_[ url ];
      }

      var promise = self.httpHeads_[ url ] = httpClient_.head( url )
         .then( function() {
            return true;
         }, function() {
            return false;
         } );

      // Free memory and cache result when the response is complete:
      promise.then( function( result ) {
         self.httpHeadCache_[ url ] = result;
         delete self.httpHeads_[ url ];
      } );

      return promise;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      /**
       * Creates and returns a new instance.
       *
       * @param {String} rootPath
       *    the path to the root of the application. It is needed to prefix relative paths found in a listing
       *    with an absolute prefix
       *
       * @return {FileResourceProvider}
       *    a new instance
       */
      create: function( rootPath ) {
         assert( q_ ).isNotNull( 'Need a promise implementation like $q or Q' );
         assert( httpClient_ ).isNotNull( 'Need a http client implementation like $http' );

         return new FileResourceProvider( rootPath );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Initializes the module.
       *
       * @param {Object} q
       *    a promise library like AngularJS' `$q`
       * @param {Object} httpClient
       *    a http client whose api conforms to AngularJS' `$http` service
       */
      init: function( q, httpClient ) {
         q_ = q;
         httpClient_ = httpClient;
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/loaders/layout_loader',[
   '../utilities/path'
], function( path ) {
   'use strict';

   function create( layoutsRoot, themesRoot, cssLoader, themeManager, fileResourceProvider, cache ) {
      return {
         load: function( layout ) {
            return resolveLayout( layout ).then(
               function( layoutInfo ) {
                  if( layoutInfo.css ) {
                     cssLoader.load( layoutInfo.css );
                  }
                  if( layoutInfo.html ) {
                     return fileResourceProvider.provide( layoutInfo.html ).then( function( htmlContent ) {
                        layoutInfo.htmlContent = htmlContent;
                        if( cache ) {
                           cache.put( layoutInfo.html, htmlContent );
                        }
                        return layoutInfo;
                     } );
                  }
                  return layoutInfo;
               }
            );
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function resolveLayout( layout ) {
         var layoutPath = path.join( layoutsRoot, layout );
         var layoutName = layoutPath.substr( layoutPath.lastIndexOf( '/' ) + 1 );
         var layoutFile = layoutName + '.html';
         var cssFile    = 'css/' + layoutName + '.css';

         return themeManager.urlProvider(
            path.join( layoutPath, '[theme]' ),
            path.join( themesRoot, '[theme]', 'layouts', layout )
         ).provide( [ layoutFile, cssFile ] ).then(
            function( results ) {
               return {
                  html: results[ 0 ],
                  css: results[ 1 ],
                  className: layoutName.replace( /\//g, '' ).replace( /_/g, '-' ) + '-layout'
               };
            }
         );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      create: create

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * The theme manager simplifies lookup of theme specific assets. It should be used via AngularJS DI as
 * *axThemeManager* service.
 *
 * @module theme_manager
 */
define( 'laxar/lib/runtime/theme_manager',[
   '../utilities/assert',
   '../utilities/path'
], function( assert, path ) {
   'use strict';

   /**
    * @param {FileResourceProvider} fileResourceProvider
    *    the file resource provider used for theme file lookups
    * @param {$q} q
    *    a `$q` like promise library
    * @param {String} theme
    *    the theme to use
    *
    * @constructor
    */
   function ThemeManager( fileResourceProvider, q, theme ) {
      this.q_ = q;
      this.fileResourceProvider_ = fileResourceProvider;
      this.theme_ = theme;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Returns the currently used theme.
    *
    * @return {String}
    *    the currently active theme
    */
   ThemeManager.prototype.getTheme = function() {
      return this.theme_;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Returns a URL provider for specific path patterns that are used to lookup themed artifacts. The token
    * `[theme]` will be replaced by the name of the currently active theme (plus `.theme` suffix) or by
    * `default.theme` as a fallback. The `provide` method of the returned object can be called with a list of
    * files for which a themed version should be found. The most specific location is searched first and the
    * default theme last.
    *
    * @param {String} artifactPathPattern
    *    a path pattern for search within the artifact directory itself, based on the current theme
    * @param {String} [themePathPattern]
    *    a path pattern for search within the current theme
    * @param {String} [fallbackPathPattern]
    *    a fallback path, used if all else fails.
    *    Usually without placeholders, e.g. for loading the default theme itself.
    *
    * @returns {{provide: Function}}
    *    an object with a provide method
    */
   ThemeManager.prototype.urlProvider = function( artifactPathPattern, themePathPattern, fallbackPathPattern ) {
      var self = this;

      return {
         provide: function( fileNames ) {
            var searchPrefixes = [];

            if( self.theme_ && self.theme_ !== 'default' ) {
               var themeDirectory = self.theme_ + '.theme';
               if( artifactPathPattern ) {
                  // highest precedence: artifacts with (multiple) embedded theme styles:
                  searchPrefixes.push( artifactPathPattern.replace( '[theme]', themeDirectory ) );
               }
               if( themePathPattern ) {
                  // second-highest precedence: themes with embedded artifact styles:
                  searchPrefixes.push( themePathPattern.replace( '[theme]', themeDirectory ) );
               }
            }

            if( artifactPathPattern ) {
               // fall back to default theme provided by the artifact
               searchPrefixes.push( artifactPathPattern.replace( '[theme]', 'default.theme' ) );
            }

            if( fallbackPathPattern ) {
               // mostly to load the default-theme itself from any location
               searchPrefixes.push( fallbackPathPattern );
            }

            var promises = [];
            for( var i = 0; i < fileNames.length; ++i ) {
               promises.push( findExistingPath( self, searchPrefixes, fileNames[ i ] ) );
            }

            return self.q_.all( promises )
               .then( function( results ) {
                  return results.map( function( result, i ) {
                     return result !== null ? path.join( result, fileNames[ i ] ) : null;
                  } );
               } );
         }
      };
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function findExistingPath( self, searchPrefixes, fileName ) {
      if( searchPrefixes.length === 0 ) {
         return self.q_.when( null );
      }

      return self.fileResourceProvider_.isAvailable( path.join( searchPrefixes[0], fileName ) )
         .then( function( available ) {
            if( available ) {
               return self.q_.when( searchPrefixes[0] );
            }

            return findExistingPath( self, searchPrefixes.slice( 1 ), fileName );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      /**
       * Creates and returns a new theme manager instance.
       *
       * @param {FileResourceProvider} fileResourceProvider
       *    the file resource provider used for theme file lookup
       * @param {$q} q
       *    a `$q` like promise library
       * @param {String} theme
       *    the theme to use
       *
       * @returns {ThemeManager}
       */
      create: function( fileResourceProvider, q, theme ) {
         return new ThemeManager( fileResourceProvider, q, theme );
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides some services for AngularJS DI. Although it is fine to use these services in widgets,
 * most of them are primarily intended to be used internally by LaxarJS. Documentation is nevertheless of use
 * when e.g. they need to be mocked during tests.
 *
 * @module axRuntimeServices
 */
define( 'laxar/lib/runtime/runtime_services',[
   'angular',
   '../event_bus/event_bus',
   '../i18n/i18n',
   '../file_resource_provider/file_resource_provider',
   '../logging/log',
   '../utilities/object',
   '../utilities/path',
   '../loaders/layout_loader',
   '../loaders/paths',
   '../utilities/configuration',
   './theme_manager'
], function(
   ng,
   eventBus,
   i18n,
   fileResourceProvider,
   log,
   object,
   path,
   layoutLoader,
   paths,
   configuration,
   themeManager
) {
   'use strict';

   var module = ng.module( 'axRuntimeServices', [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var $qProvider_;
   module.config( [ '$qProvider', '$httpProvider', function( $qProvider, $httpProvider ) {
      $qProvider_ = $qProvider;
      if( configuration.get( CONFIG_KEY_HTTP_LOGGING_HEADER ) ) {
         $httpProvider.interceptors.push( 'axLogHttpInterceptor' );
      }
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * This is a scheduler for asynchronous tasks (like nodejs' `process.nextTick`)  trimmed for performance.
    * It is intended for use cases where many tasks are scheduled in succession within one JavaScript event
    * loop. It integrates into the AngularJS *$digest* cycle, while trying to minimize the amount of full
    * *$digest* cycles.
    *
    * For example in LaxarJS the global event bus instance ({@link axGlobalEventBus}) uses this service.
    *
    * @name axHeartbeat
    * @injection
    */
   module.factory( 'axHeartbeat', [ '$window', '$rootScope', function( $window, $rootScope ) {
      var nextQueue = [];
      var beatRequested = false;

      /**
       * Schedules a function for the next heartbeat. If no heartbeat was triggered yet, it will be requested
       * now.
       *
       * @param {Function} func
       *    a function to schedule for the next tick
       *
       * @memberOf axHeartbeat
       */
      function onNext( func ) {
         if( !beatRequested ) {
            beatRequested = true;
            $window.setTimeout( function() {
               while( beforeQueue.length ) { beforeQueue.shift()(); }
               // The outer loop handles events published from apply-callbacks (watchers, promises).
               do {
                  while( nextQueue.length ) { nextQueue.shift()(); }
                  $rootScope.$apply();
               }
               while( nextQueue.length );
               while( afterQueue.length ) { afterQueue.shift()(); }
               beatRequested = false;
            }, 0 );
         }
         nextQueue.push( func );
      }

      var beforeQueue = [];

      /**
       * Schedules a function to be called before the next heartbeat occurs. Note that `func` may never be
       * called, if there is no next heartbeat.
       *
       * @param {Function} func
       *    a function to call before the next heartbeat
       *
       * @memberOf axHeartbeat
       */
      function onBeforeNext( func ) {
         beforeQueue.push( func );
      }

      var afterQueue = [];

      /**
       * Schedules a function to be called after the next heartbeat occured. Note that `func` may never be
       * called, if there is no next heartbeat.
       *
       * @param {Function} func
       *    a function to call after the next heartbeat
       *
       * @memberOf axHeartbeat
       */
      function onAfterNext( func ) {
         afterQueue.push( func );
      }

      return {
         onBeforeNext: onBeforeNext,
         onNext: onNext,
         onAfterNext: onAfterNext
      };
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * A timestamp function, provided as a service to support the jasmine mock clock during testing. The
    * mock-free implementation simply uses `new Date().getTime()`. Whenever a simple timestamp is needed in a
    * widget, this service can be used to allow for hassle-free testing.
    *
    * Example:
    * ```js
    * Controller.$inject = [ 'axTimestamp' ];
    * function Controller( axTimestamp ) {
    *    var currentTimestamp = axTimestamp();
    * };
    * ```
    *
    * @name axTimestamp
    * @injection
    */
   module.factory( 'axTimestamp', function() {
      return function() {
         return new Date().getTime();
      };
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * The global event bus instance provided by the LaxarJS runtime. Widgets **should never** use this, as
    * subscriptions won't be removed when a widget is destroyed. Instead widgets should always either use the
    * `eventBus` property on their local `$scope` object or the service `axEventBus`. These take care of all
    * subscriptions on widget destructions and thus prevent from leaking memory and other side effects.
    *
    * This service instead can be used by other services, that live throughout the whole lifetime of an
    * application or take care of unsubscribing from events themselves. Further documentation on the api can
    * be found at the *event_bus* module api doc.
    *
    * @name axGlobalEventBus
    * @injection
    */
   module.factory( 'axGlobalEventBus', [
      '$injector', '$window', 'axHeartbeat', 'axConfiguration',
      function( $injector, $window, heartbeat, configuration ) {
         // LaxarJS/laxar#48: Use event bus ticks instead of $apply to run promise callbacks
         var $q = $injector.invoke( $qProvider_.$get, $qProvider_, {
            $rootScope: {
               $evalAsync: heartbeat.onNext
            }
         } );

         eventBus.init( $q, heartbeat.onNext, function( f, t ) {
            // MSIE Bug, we have to wrap set timeout to pass assertion
            $window.setTimeout( f, t );
         } );

         var bus = eventBus.create( {
            pendingDidTimeout: configuration.get( 'eventBusTimeoutMs', 120*1000 )
         } );
         bus.setErrorHandler( eventBusErrorHandler );

         return bus;
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Provides access to the global configuration, otherwise accessible via the *configuration* module.
    * Further documentation can be found there.
    *
    * @name axConfiguration
    * @injection
    */
   module.factory( 'axConfiguration', [ function() {
      return configuration;
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Provides access to the i18n api, otherwise accessible via the *i18n* module. Further documentation can
    * be found there.
    *
    * @name axI18n
    * @injection
    */
   module.factory( 'axI18n', [ function() {
      return i18n;
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * A global, pre-configured file resource provider instance. Further documentation on the api can
    * be found at the *file_resource_provider* module api doc.
    *
    * This service has already all the file listings configured under `window.laxar.fileListings`. These can
    * either be uris to listing JSON files or already embedded JSON objects of the directory tree.
    *
    * @name axFileResourceProvider
    * @injection
    */
   module.factory( 'axFileResourceProvider', [
      '$q', '$http', 'axConfiguration',
      function( $q, $http, configuration ) {
         fileResourceProvider.init( $q, $http );

         var provider = fileResourceProvider.create( paths.PRODUCT );
         var listings = configuration.get( 'fileListings' );
         if( listings ) {
            ng.forEach( listings, function( value, key ) {
               if( typeof value === 'string' ) {
                  provider.setFileListingUri( key, value );
               }
               else {
                  provider.setFileListingContents( key, value );
               }
            } );
         }

         return provider;
      }
   ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Provides access to the configured theme and theme relevant assets via a theme manager instance. Further
    * documentation on the api can be found at the *theme_manager* module api doc.
    *
    * @name axThemeManager
    * @injection
    */
   module.factory( 'axThemeManager', [
      '$q', 'axConfiguration', 'axFileResourceProvider',
      function( $q, configuration, fileResourceProvider ) {
         var theme = configuration.get( 'theme' );
         var manager = themeManager.create( fileResourceProvider, $q, theme );

         return {
            getTheme: manager.getTheme.bind( manager ),
            urlProvider: manager.urlProvider.bind( manager )
         };
      }
   ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Loads a layout relative to the path `laxar-path-root` configured via RequireJS (by default
    * `/application/layouts`), taking the configured theme into account. If a CSS file is found, it will
    * directly be loaded into the page. A HTML template will instead get returned for manual insertion at the
    * correct DOM location. For this service there is also the companion directive *axLayout* available.
    *
    * Example:
    * ```js
    * myNgModule.directive( [ 'axLayoutLoader', function( axLayoutLoader ) {
    *    return {
    *       link: function( scope, element, attrs ) {
    *          axLayoutLoader.load( 'myLayout' )
    *             .then( function( layoutInfo ) {
    *                element.html( layoutInfo.html );
    *             } );
    *       }
    *    };
    * } ] );
    * ```
    *
    * @name axLayoutLoader
    * @injection
    */
   module.factory( 'axLayoutLoader', [
      '$templateCache', 'axCssLoader', 'axThemeManager', 'axFileResourceProvider',
      function( $templateCache, cssLoader, themeManager, fileResourceProvider ) {
         return layoutLoader.create(
            paths.LAYOUTS, paths.THEMES, cssLoader, themeManager, fileResourceProvider, $templateCache
         );
      }
   ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * A service to load css files on demand during development. If a merged release css file has already been
    * loaded (marked with a `data-ax-merged-css` html attribute at the according `link` tag) or `useMergedCss`
    * is configured as `true`, the `load` method will simply be a noop. In the latter case the merged css file
    * will be loaded once by this service.
    *
    * @name axCssLoader
    * @injection
    */
   module.factory( 'axCssLoader', [ 'axConfiguration', 'axThemeManager', function( configuration, themeManager ) {
      var mergedCssFileLoaded = [].some.call( document.getElementsByTagName( 'link' ), function( link ) {
         return link.hasAttribute( 'data-ax-merged-css' );
      } );

      if( mergedCssFileLoaded ) {
         return { load: function() {} };
      }

      var loadedFiles = [];
      var loader = {
         /**
          * If not already loaded, loads the given file into the current page by appending a `link` element to
          * the document's `head` element.
          *
          * Additionally it works around a
          * [style sheet limit](http://support.microsoft.com/kb/262161) in older Internet Explorers
          * (version < 10). The workaround is based on
          * [this test](http://john.albin.net/ie-css-limits/993-style-test.html).
          *
          * @param {String} url
          *    the url of the css file to load
          *
          * @memberOf axCssLoader
          */
         load: function( url ) {

            if( loadedFiles.indexOf( url ) === -1 ) {
               if( hasStyleSheetLimit() ) {
                  // Here we most probably have an Internet Explorer having the limit of at most 31 stylesheets
                  // per page. As a workaround we use style tags with import statements. Each style tag may
                  // have 31 import statement. This gives us 31 * 31 = 961 possible stylesheets to include ...
                  // Link to the problem on microsoft.com: http://support.microsoft.com/kb/262161
                  // Solution based on ideas found here: http://john.albin.net/css/ie-stylesheets-not-loading

                  var styleManagerId = 'cssLoaderStyleSheet' + Math.floor( loadedFiles.length / 30 );
                  if( !document.getElementById( styleManagerId ) ) {
                     addHeadElement( 'style', {
                        type: 'text/css',
                        id: styleManagerId
                     } );
                  }

                  document.getElementById( styleManagerId ).styleSheet.addImport( url );
               }
               else {
                  addHeadElement( 'link', {
                     type: 'text/css',
                     id: 'cssLoaderStyleSheet' + loadedFiles.length,
                     rel: 'stylesheet',
                     href: url
                  } );
               }

               loadedFiles.push( url );
            }
         }
      };

      if( configuration.get( 'useMergedCss', false ) ) {
         loader.load( path.join( paths.PRODUCT, 'var/static/css', themeManager.getTheme() + '.theme.css' ) );
         return { load: function() {} };
      }

      return loader;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function hasStyleSheetLimit() {
         if( typeof hasStyleSheetLimit.result !== 'boolean' ) {
            hasStyleSheetLimit.result = false;
            if( document.createStyleSheet ) {
               var uaMatch = navigator.userAgent.match( /MSIE ?(\d+(\.\d+)?)[^\d]/i );
               if( !uaMatch || parseFloat( uaMatch[1] ) < 10 ) {
                  // There is no feature test for this problem without running into it. We therefore test
                  // for a browser knowing document.createStyleSheet (should only be IE) and afterwards check,
                  // if it is a version prior to 10 as the problem is fixed since that version. In any other
                  // case we assume the worst case and trigger the hack for limited browsers.
                  hasStyleSheetLimit.result = true;
               }
            }
         }
         return hasStyleSheetLimit.result;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function addHeadElement( elementName, attributes ) {
         var element = document.createElement( elementName );
         ng.forEach( attributes, function( val, key ) {
            element[ key ] = val;
         } );
         document.getElementsByTagName( 'head' )[0].appendChild( element );
      }
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Directives should use this service to stay informed about visibility changes to their widget.
    * They should not attempt to determine their visibility from the event bus (no DOM information),
    * nor poll it from the browser (too expensive).
    *
    * In contrast to the visibility events received over the event bus, these handlers will fire _after_ the
    * visibility change has been implemented in the DOM, at which point in time the actual browser rendering
    * state should correspond to the information conveyed in the event.
    *
    * The visibility service allows to register for onShow/onHide/onChange. When cleared, all handlers for
    * the given scope will be cleared. Handlers are automatically cleared as soon as the given scope is
    * destroyed. Handlers will be called whenever the given scope's visibility changes due to the widget
    * becoming visible/invisible. Handlers will _not_ be called on state changes originating _from within_ the
    * widget such as those caused by `ngShow`.
    *
    * If a widget becomes visible at all, the corresponding handlers for onChange and onShow are guaranteed
    * to be called at least once.
    *
    * @name axVisibilityService
    * @injection
    */
   module.factory( 'axVisibilityService', [ 'axHeartbeat', '$rootScope', function( heartbeat, $rootScope ) {

      /**
       * Create a DOM visibility handler for the given scope.
       *
       * @param {Object} scope
       *    the scope from which to infer visibility. Must be a widget scope or nested in a widget scope
       *
       * @return {axVisibilityServiceHandler}
       *    a visibility handler for the given scope
       *
       * @memberOf axVisibilityService
       */
      function handlerFor( scope ) {
         var handlerId = scope.$id;
         scope.$on( '$destroy', clear );

         // Find the widget scope among the ancestors:
         var widgetScope = scope;
         while( widgetScope !== $rootScope && !(widgetScope.widget && widgetScope.widget.area) ) {
            widgetScope = widgetScope.$parent;
         }

         var areaName = widgetScope.widget && widgetScope.widget.area;
         if( !areaName ) {
            throw new Error( 'axVisibilityService: could not determine widget area for scope: ' + handlerId );
         }

         /**
          * A scope bound visibility handler.
          *
          * @name axVisibilityServiceHandler
          */
         var api = {

            /**
             * Determine if the governing widget scope's DOM is visible right now.
             *
             * @return {Boolean}
             *    `true` if the widget associated with this handler is visible right now, else `false`
             *
             * @memberOf axVisibilityServiceHandler
             */
            isVisible: function() {
               return isVisible( areaName );
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            /**
             * Schedule a handler to be called with the new DOM visibility on any DOM visibility change.
             *
             * @param {Function<Boolean>} handler
             *    the callback to process visibility changes
             *
             * @return {axVisibilityServiceHandler}
             *    this visibility handler (for chaining)
             *
             * @memberOf axVisibilityServiceHandler
             */
            onChange: function( handler ) {
               addHandler( handlerId, areaName, handler, true );
               addHandler( handlerId, areaName, handler, false );
               return api;
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            /**
             * Schedule a handler to be called with the new DOM visibility when it has changed to `true`.
             *
             * @param {Function<Boolean>} handler
             *    the callback to process visibility changes
             *
             * @return {axVisibilityServiceHandler}
             *    this visibility handler (for chaining)
             *
             * @memberOf axVisibilityServiceHandler
             */
            onShow: function( handler ) {
               addHandler( handlerId, areaName, handler, true );
               return api;
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            /**
             * Schedule a handler to be called with the new DOM visibility when it has changed to `false`.
             *
             * @param {Function<Boolean>} handler
             *    the callback to process visibility changes
             *
             * @return {axVisibilityServiceHandler}
             *    this visibility handler (for chaining)
             *
             * @memberOf axVisibilityServiceHandler
             */
            onHide: function( handler ) {
               addHandler( handlerId, areaName, handler, false );
               return api;
            },

            //////////////////////////////////////////////////////////////////////////////////////////////////

            /**
             * Removes all visibility handlers.
             *
             * @return {axVisibilityServiceHandler}
             *    this visibility handler (for chaining)
             *
             * @memberOf axVisibilityServiceHandler
             */
            clear: clear

         };

         return api;

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function clear() {
            clearHandlers( handlerId );
            return api;
         }

      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      // track state to inform handlers that register after visibility for a given area was initialized
      var knownState;

      // store the registered show/hide-handlers by governing widget area
      var showHandlers;
      var hideHandlers;

      // secondary lookup-table to track removal, avoiding O(n^2) cost for deleting n handlers in a row
      var handlersById;

      return {
         isVisible: isVisible,
         handlerFor: handlerFor,
         // runtime-internal api for use by the page controller
         _updateState: updateState,
         _reset: reset
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function reset() {
         knownState = {};
         showHandlers = {};
         hideHandlers = {};
         handlersById = {};
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Determine if the given area's content DOM is visible right now.
       * @param {String} area
       *    the full name of the widget area to query
       *
       * @return {Boolean}
       *    `true` if the area is visible right now, else `false`.
       *
       * @memberOf axVisibilityService
       */
      function isVisible( area ) {
         return knownState[ area ] || false;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Run all handlers registered for the given area and target state after the next heartbeat.
       * Also remove any handlers that have been cleared since the last run.
       * @private
       */
      function updateState( area, targetState ) {
         if( knownState[ area ] === targetState ) {
            return;
         }
         knownState[ area ] = targetState;
         heartbeat.onAfterNext( function() {
            var areaHandlers = ( targetState ? showHandlers : hideHandlers )[ area ];
            if( !areaHandlers ) { return; }
            for( var i = areaHandlers.length - 1; i >= 0; --i ) {
               var handlerRef = areaHandlers[ i ];
               if( handlerRef.handler === null ) {
                  areaHandlers.splice( i, 1 );
               }
               else {
                  handlerRef.handler( targetState );
               }
            }
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Add a show/hide-handler for a given area and visibility state. Execute the handler right away if the
       * state is already known.
       * @private
       */
      function addHandler( id, area, handler, targetState ) {
         var handlerRef = { handler: handler };
         handlersById[ id ] = handlersById[ id ] || [];
         handlersById[ id ].push( handlerRef );

         var areaHandlers = targetState ? showHandlers : hideHandlers;
         areaHandlers[ area ] = areaHandlers[ area ] || [];
         areaHandlers[ area ].push( handlerRef );

         // State already known? In that case, initialize:
         if( area in knownState && knownState[ area ] === targetState ) {
            handler( targetState );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function clearHandlers( id ) {
         if( handlersById[ id ] ) {
            handlersById[ id ].forEach( function( matchingHandlerRef ) {
               matchingHandlerRef.handler = null;
            } );
         }
      }

   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.factory( 'axLogHttpInterceptor', [ 'axConfiguration', function( configuration ) {
      var headerKey = configuration.get( CONFIG_KEY_HTTP_LOGGING_HEADER, null );
      return headerKey ? {
         request: function( config ) {
            var headerValue = '';
            ng.forEach( log.gatherTags(), function( tagValue, tagName ) {
               headerValue += '[' + tagName + ':' + tagValue + ']';
            } );

            if( headerValue ) {
               if( config.headers[ headerKey ] ) {
                  log.warn( 'axLogHttpInterceptor: Overwriting existing header "[0]"', headerKey );
               }
               config.headers[ headerKey ] = headerValue;
            }
            return config;
         }
      } : {};
   } ] );

   var CONFIG_KEY_HTTP_LOGGING_HEADER = 'logging.http.header';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Overrides the default `$exceptionHandler` service of AngularJS, using the LaxarJS logger for output.
    *
    * @name $exceptionHandler
    * @injection
    * @private
    */
   module.provider( '$exceptionHandler', function() {
      var handler = function( exception, cause ) {
         var msg = exception.message || exception;
         log.error( 'There was an exception: ' + msg + ', \nstack: ' );
         log.error( exception.stack + ', \n' );
         log.error( '  Cause: ' + cause );
      };

      this.$get = [ function() {
         return handler;
      } ];
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var sensitiveData = [ 'Published event' ];
   function eventBusErrorHandler( message, optionalErrorInformation ) {
      log.error( 'EventBus: ' + message );

      if( optionalErrorInformation ) {
         ng.forEach( optionalErrorInformation, function( info, title ) {
            var formatString = '   - [0]: [1:%o]';
            if( sensitiveData.indexOf( title ) !== -1 ) {
               formatString = '   - [0]: [1:%o:anonymize]';
            }

            log.error( formatString, title, info );

            if( info instanceof Error && info.stack ) {
               log.error( '   - Stacktrace: ' + info.stack );
            }
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/json/schema',[
   '../utilities/object'
], function( object ) {
   'use strict';

   function transformV3V4Recursively( schema, parentKey, parentSchema, originalParentSchema ) {
      var resultingSchema = {};

      Object.keys( schema ).forEach( function( key ) {

         var value = schema[ key ];

         switch( key ) {
            case 'required':
               if( value !== true ) {
                  break;
               }

               if( isNamedProperty( parentKey, originalParentSchema ) && !( 'default' in schema ) ) {
                  if( !( 'required' in parentSchema ) ) {
                     parentSchema.required = [];
                  }
                  parentSchema.required.push( parentKey );
               }
               break;

            case 'items':
               resultingSchema[ key ] = transformV3V4Recursively( value, key, resultingSchema, schema );
               break;

            case 'additionalProperties':
               if( typeof value === 'object' ) {
                  resultingSchema[ key ] = transformV3V4Recursively( value, key, resultingSchema, schema );
               }
               else {
                  resultingSchema[ key ] = value;
               }
               break;

            case 'properties':
            case 'patternProperties':
               resultingSchema[ key ] = {};
               object.forEach( value, function( patternSchema, pattern ) {
                  resultingSchema[ key ][ pattern ] =
                     transformV3V4Recursively( patternSchema, pattern, resultingSchema, schema );
               } );
               break;

            default:
               resultingSchema[ key ] = value;

         }

      } );

      // LaxarJS specific: transform "not required" to "allow null"
      if( isNamedProperty( parentKey, originalParentSchema ) && !schema.required ) {
         var propertyType = resultingSchema.type;
         if( typeof propertyType === 'string' && propertyType !== 'null' ) {
            resultingSchema.type = [ propertyType, 'null' ];
         }
         else if( Array.isArray( propertyType ) && propertyType.indexOf( 'null' ) === -1 ) {
            propertyType.push( 'null' );
         }
      }

      return resultingSchema;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function prohibitAdditionalPropertiesRecursively( schema ) {
      if( ( 'properties' in schema || 'patternProperties' in schema ) &&
         !( 'additionalProperties' in schema ) ) {
         schema.additionalProperties = false;
      }

      if( 'properties' in schema ) {
         Object.keys( schema.properties ).forEach( function( name ) {
            prohibitAdditionalPropertiesRecursively( schema.properties[ name ] );
         } );
      }

      if( 'additionalProperties' in schema && typeof schema.additionalProperties === 'object' ) {
         prohibitAdditionalPropertiesRecursively( schema.additionalProperties );
      }

      if( 'patternProperties' in schema ) {
         Object.keys( schema.patternProperties ).forEach( function( pattern ) {
            prohibitAdditionalPropertiesRecursively( schema.patternProperties[ pattern ] );
         } );
      }

      if( 'items' in schema ) {
         prohibitAdditionalPropertiesRecursively( schema.items );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function isNamedProperty( key, parentSchema ) {
      return parentSchema &&
         schemaAllowsType( parentSchema, 'object' ) &&
         object.path( parentSchema, 'properties.' + key );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function schemaAllowsType( schema, type ) {
      var schemaType = schema.type;
      if( typeof schemaType === 'string' ) {
         return schemaType === type;
      }
      if( Array.isArray( schemaType ) ) {
         return schemaType.indexOf( type ) !== -1;
      }

      return true;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      transformV3ToV4: function( schema ) {
         return transformV3V4Recursively( schema );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      prohibitAdditionalProperties: function( schema ) {
         prohibitAdditionalPropertiesRecursively( schema );
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/json/validator',[
   'jjv',
   'jjve',
   './schema',
   '../utilities/object'
], function( jjv, jjve, schema, objectUtils ) {
   'use strict';

   var JSON_SCHEMA_V4_URI = 'http://json-schema.org/draft-04/schema#';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function transformResult( result, schema, object, env ) {
      if( !result ) {
         return {
            errors: []
         };
      }

      var messageGenerator = jjve( env );

      return {
         errors: messageGenerator( schema, object, result )
            .map( function( error ) {
               return objectUtils.options( {
                  message: error.message + '. Path: "' + error.path + '".'
               }, error );
            } )
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      /**
       * Creates and returns a new JSON validator for schema draft version 4. Minimal conversion from v3 to v4
       * is builtin, but it is strongly advised to create new schemas using the version 4 draft. Version
       * detection for v4 is realized by checking if the `$schema` property of the root schema equals the
       * uri `http://json-schema.org/draft-04/schema#`. If the `$schema` property is missing or has a
       * different value, v3 is assumed.
       * See https://github.com/json-schema/json-schema/wiki/ChangeLog for differences between v3 and v4.
       *
       * @param {Object} jsonSchema
       *    the JSON schema to use when validating
       * @param {Object} [options]
       *    an optional set of options
       * @param {Boolean} options.prohibitAdditionalProperties
       *    sets additionalProperties to false if not defined otherwise for the according object schema
       * @param {Boolean} options.checkRequired
       *    (jjv option) if `true` it reports missing required properties, otherwise it allows missing
       *    required properties. Default is `true`
       * @param {Boolean} options.useDefault
       *    (jjv option) If true it modifies the validated object to have the default values for missing
       *    non-required fields. Default is `false`
       * @param {Boolean} options.useCoerce
       *    (jjv option) if `true` it enables type coercion where defined. Default is `false`
       * @param {Boolean} options.removeAdditional
       *    (jjv option) if `true` it removes all attributes of an object which are not matched by the
       *    schema's specification. Default is `false`
       *
       *
       * @return {Object}
       *    a new instance of JsonValidator
       */
      create: function( jsonSchema, options ) {
         var env = jjv();
         options = objectUtils.options( options, {
            prohibitAdditionalProperties: false
         } );
         env.defaultOptions = objectUtils.options( options, env.defaultOptions );

         if( !( '$schema' in jsonSchema ) || jsonSchema.$schema !== JSON_SCHEMA_V4_URI ) {
            // While schema draft v4 is directly supported by the underlying validator, we need to transform
            // older v3 schemas to valid v4 schemas. Furthermore all of our existing schemas are v3 without
            // version info. Thus, whenever we find a schema without version info or a version info that isn't
            // v4, we assume a v3 schema and translate it to v4.
            // Note that only the small subset of v3 features is transformed v4 features that is needed for
            // legacy schemas.
            // Using `this` reference for testability / spying
            jsonSchema = schema.transformV3ToV4( jsonSchema );
            jsonSchema.$schema = JSON_SCHEMA_V4_URI;

            env.addType( 'any', function( value ) {
               return true;
            } );
         }

         if( options.prohibitAdditionalProperties ) {
            schema.prohibitAdditionalProperties( jsonSchema );
         }

         var origValidate = env.validate;

         env.validate = function( object ) {
            var result = origValidate.call( env, jsonSchema, object );
            return transformResult( result, jsonSchema, object, env );
         };

         return env;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      JSON_SCHEMA_V4_URI: JSON_SCHEMA_V4_URI

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/utilities/timer',[
   './object',
   './storage',
   '../logging/log'
], function( object, storage, log ) {
   'use strict';

   var idCounter = 0;
   var store = storage.getSessionStorage( 'timer' );

   function Timer( optionalOptions ) {
      this.options_ = object.options( optionalOptions, {
         label: 'timer' + idCounter++,
         persistenceKey: null
      } );
      this.startTime_ = null;
      this.stopTime_ = null;
      this.splitTimes_ = [];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Timer.prototype.getData = function() {
      return {
         label: this.options_.label,
         startTime: this.startTime_,
         stopTime: this.stopTime_,
         splitTimes: object.deepClone( this.splitTimes_ )
      };
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Timer.prototype.start = function() {
      this.startTime_ = now();

      saveIfPersistent( this );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Timer.prototype.splitTime = function( optionalLabel ) {
      this.splitTimes_.push( {
         time: now(),
         label: optionalLabel || 'split' + this.splitTimes_.length
      } );

      saveIfPersistent( this );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Timer.prototype.stop = function() {
      this.stopTime_ = now();

      removeIfPersistent( this );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Timer.prototype.stopAndLog = function( optionalLabel ) {
      this.stop();

      var startTime = this.startTime_;
      var endTime = now();
      var label = optionalLabel || 'Timer Stopped';
      this.splitTimes_.push( { label: label, time: endTime } );

      var message = [];
      message.push( 'Timer "', this.options_.label, '": ' );
      message.push( 'start at ', new Date( startTime ).toISOString(), ' (client), ' );
      message.push( label, ' after ', ( endTime - startTime ).toFixed( 0 ), 'ms ' );
      message.push( '(checkpoints: ' );
      var intervals = [];
      this.splitTimes_.reduce( function( from, data ) {
         intervals.push( '"' + data.label + '"=' + ( data.time - from ).toFixed( 0 ) + 'ms' );
         return data.time;
      }, startTime );
      message.push( intervals.join( ', ' ), ')' );
      log.info( message.join( '' ) );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function now() {
      // cannot use window.performance, because timings need to be valid across pages:
      return new Date().getTime();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function saveIfPersistent( timer ) {
      if( timer.options_.persistenceKey ) {
         store.setItem( timer.options_.persistenceKey, {
            options: timer.options_,
            startTime: timer.startTime_,
            stopTime: timer.stopTime_,
            splitTimes: timer.splitTimes_
         } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function restoreIfPersistent( timer ) {
      if( timer.options_.persistenceKey ) {
         var data = store.getItem( timer.options_.persistenceKey );
         if( data ) {
            timer.options_ = data.options;
            timer.startTime_ = data.startTime;
            timer.stopTime_ = data.stopTime;
            timer.splitTimes_ = data.splitTimes;
            return true;
         }
      }

      return false;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function removeIfPersistent( timer ) {
      if( timer.options_.persistenceKey ) {
         store.removeItem( timer.options_.persistenceKey );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      started: function( optionalOptions ) {
         var timer = new Timer( optionalOptions );
         timer.start();
         return timer;
      },

      resumedOrStarted: function( optionalOptions ) {
         var timer = new Timer( optionalOptions );
         if( !restoreIfPersistent( timer ) ) {
            timer.start();
         }
         return timer;
      }

   };

} );


define("json!laxar/static/schemas/flow.json", function(){ return {
   "$schema": "http://json-schema.org/draft-04/schema#",
   "type": "object",
   "required": [ "places" ],
   "properties": {

      "places": {
         "type": "object",
         "description": "The places for this flow.",
         "patternProperties": {
            "[a-z][a-zA-Z0-9_]*": {
               "type": "object",
               "properties": {

                  "redirectTo": {
                     "type": "string",
                     "description": "The place to redirect to when hitting this place."
                  },
                  "page": {
                     "type": "string",
                     "description": "The page to render for this place."
                  },
                  "targets": {
                     "type": "object",
                     "patternProperties": {
                        "[a-z][a-zA-Z0-9_]*": {
                           "type": "string"
                        }
                     },
                     "description": "A map of symbolic targets to places reachable from this place."
                  },
                  "entryPoints": {
                     "type": "object",
                     "patternProperties": {
                        "[a-z][a-zA-Z0-9_]*": {
                           "type": "string"
                        }
                     },
                     "description": "Entry points defined by this place."
                  },
                  "exitPoint": {
                     "type": "string",
                     "description": "The exit point to invoke when reaching this place."
                  }

               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      }

   },
   "additionalProperties": false
}
;});

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * The *flow* module is responsible for the handling of all tasks regarding navigation and routing and as such
 * is part of the LaxarJS core. It is your communication partner on the other end of the event bus for
 * `navigateRequest`, `willNavigate` and `didNavigate` events. For application developers it additionally
 * provides the `axFlowService`, which can be used for some flow specific tasks.
 *
 * @module flow
 */
define( 'laxar/lib/runtime/flow',[
   'angular',
   'angular-route',
   '../logging/log',
   '../json/validator',
   '../utilities/object',
   '../utilities/timer',
   '../utilities/path',
   '../loaders/paths',
   'json!../../static/schemas/flow.json'
], function( ng, ngRoute, log, jsonValidator, object, timer, path, paths, flowSchema ) {
   'use strict';

   var module = ng.module( 'axFlow', [ 'ngRoute' ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var $routeProvider_;

   module.config( [ '$routeProvider', function( $routeProvider ) {
      $routeProvider_ = $routeProvider;
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var fileResourceProvider_;
   var exitPoints_;
   var entryPoint_;

   module.run( [
      '$route', 'axConfiguration', 'axFileResourceProvider',

      function( $route, configuration, fileResourceProvider ) {
         fileResourceProvider_ = fileResourceProvider;

         entryPoint_ = configuration.get( 'flow.entryPoint' );
         exitPoints_ = configuration.get( 'flow.exitPoints' );

         // idea for lazy loading routes using $routeProvider and $route.reload() found here:
         // https://groups.google.com/d/msg/angular/mrcy_2BZavQ/Mqte8AvEh0QJ
         loadFlow( path.normalize( paths.FLOW_JSON ) ).then( function() {
            $route.reload();
         } );
      } ]
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var SESSION_KEY_TIMER = 'navigationTimer';
   var TARGET_SELF = '_self';

   var activeTarget_ = TARGET_SELF;
   var activePlace_ = null;
   var activeParameters_ = {};

   var places_;
   var previousNavigateRequestSubscription_;
   var navigationInProgress_ = false;
   var navigationTimer_;

   var eventOptions = { sender: 'AxFlowController' };
   var subscriberOptions = { subscriber: 'AxFlowController' };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.controller( 'AxFlowController', [
      '$window', '$location', '$routeParams', 'place', 'axGlobalEventBus', 'axFlowService', 'axPageService',

      function FlowController( $window, $location, $routeParams, place, eventBus, flowService, pageService ) {
         // The flow controller is instantiated on route change by AngularJS. It then announces the start of
         // navigation ("willNavigate") and initiates loading of the new page. As soon as the new page is
         // loaded, the "didNavigate" event finishes the navigation logic. The flow controller then starts to
         // listen for subsequent navigateRequests.
         if( previousNavigateRequestSubscription_ ) {
            eventBus.unsubscribe( previousNavigateRequestSubscription_ );
            previousNavigateRequestSubscription_ = null;
         }

         var previousPlace = activePlace_;
         activePlace_ = place;
         activeParameters_ = decodeExpectedPlaceParameters( $routeParams, place );

         if( typeof place.exitPoint === 'string' ) {
            var exit = place.exitPoint;
            if( exitPoints_ && typeof exitPoints_[ exit ] === 'function' ) {
               exitPoints_[ exit ]( activeParameters_ );
               return;
            }
            throw new Error( 'Exitpoint "' + exit + '" does not exist.' );
         }

         navigationInProgress_ = true;
         var navigateEvent = { target: activeTarget_ };
         var didNavigateEvent =  object.options( { data: {}, place: place.id }, navigateEvent );

         eventBus.publish( 'willNavigate.' + activeTarget_, navigateEvent, eventOptions )
            .then( function() {
               didNavigateEvent.data = activeParameters_;

               if( place === previousPlace ) {
                  return finishNavigation( activeTarget_, didNavigateEvent );
               }

               return pageService.controller().tearDownPage()
                  .then( function() {
                     navigationTimer_ = timer.resumedOrStarted( {
                        label: [ 'loadTimer (', place.target ? place.target._self : place.id, ')' ].join( '' ),
                        persistenceKey: SESSION_KEY_TIMER
                     } );
                     return pageService.controller().setupPage( place.page );
                  } )
                  .then( function() {
                     return finishNavigation( activeTarget_, didNavigateEvent );
                  } )
                  .then( function() {
                     navigationTimer_.stopAndLog( 'didNavigate' );
                  } );
            } )
            .then( null, function( error ) {
               log.error( error );
            } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function handleNavigateRequest( event, meta ) {
            if( navigationInProgress_ ) {
               // make sure that at most one navigate request be handled at the same time
               return;
            }
            navigationInProgress_ = true;

            activeTarget_ = event.target;
            var placeName = placeNameForNavigationTarget( activeTarget_, place );
            var newPlace = places_[ placeName ];

            navigationTimer_ = timer.started( {
               label: [
                  'navigation (', place ? place.targets._self : '', ' -> ', newPlace.targets._self, ')'
               ].join( '' ),
               persistenceKey: SESSION_KEY_TIMER
            } );

            var newPath = flowService.constructPath( event.target, event.data );
            if( newPath !== $location.path() ) {
               // this will instantiate another flow controller
               $location.path( newPath );
               meta.unsubscribe();
            }
            else {
               // nothing to do:
               navigationInProgress_ = false;
            }
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function finishNavigation( currentTarget_, didNavigateEvent ) {
            eventBus.subscribe( 'navigateRequest', handleNavigateRequest, subscriberOptions );
            log.setTag( 'PLCE', place.id );
            if( previousNavigateRequestSubscription_ ) {
               eventBus.unsubscribe( previousNavigateRequestSubscription_ );
            }
            previousNavigateRequestSubscription_ = handleNavigateRequest;
            navigationInProgress_ = false;
            return eventBus.publish( 'didNavigate.' + currentTarget_, didNavigateEvent, eventOptions );
         }

      }
   ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * A service providing some flow specific tasks that may be useful from within widgets.
    *
    * @name axFlowService
    * @injection
    */
   module.factory( 'axFlowService', [ '$location', function( $location ) {

      var flowService = {

         /**
          * Constructs a path, that is compatible to the expected arguments of `$location.path()` from
          * AngularJS. If a target is given as first argument, this is resolved using the currently active
          * place.
          *
          * @param {String} targetOrPlace
          *    the target or place id to construct the url for
          * @param {Object} [optionalParameters]
          *    optional map of place parameters. Missing parameters are taken from the parameters that were
          *    passed to the currently active place
          *
          * @return {string}
          *    the generated path
          *
          * @memberOf axFlowService
          */
         constructPath: function( targetOrPlace, optionalParameters ) {
            var newParameters = object.options( optionalParameters, activeParameters_ || {} );
            var placeName = placeNameForNavigationTarget( targetOrPlace, activePlace_ );
            var place = places_[ placeName ];
            var location = '/' + placeName;

            object.forEach( place.expectedParameters, function( parameterName ) {
               location += '/' + encodePlaceParameter( newParameters[ parameterName ] );
            } );

            return location;
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Constructs a path and prepends a `#` to make it directly usable as relative link within an
          * application. If a target is given as first argument, this is resolved using the currently active
          * place.
          *
          * @param {String} targetOrPlace
          *    the target or place id to construct the url for
          * @param {Object} [optionalParameters]
          *    optional map of place parameters. Missing parameters are taken from the parameters that were
          *    passed to the currently active place
          *
          * @return {string}
          *    the generated anchor
          *
          * @memberOf axFlowService
          */
         constructAnchor: function( targetOrPlace, optionalParameters ) {
            return '#' + flowService.constructPath( targetOrPlace, optionalParameters );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Constructs an absolute url to the given target or place using the given parameters application. If
          * a target is given as first argument, this is resolved using the currently active place.
          *
          * @param {String} targetOrPlace
          *    the target or place id to construct the url for
          * @param {Object} [optionalParameters]
          *    optional map of place parameters. Missing parameters are taken from the parameters that were
          *    passed to the currently active place
          *
          * @return {string}
          *    the generated url
          *
          * @memberOf axFlowService
          */
         constructAbsoluteUrl: function( targetOrPlace, optionalParameters ) {
            var absUrl = $location.absUrl().split( '#' )[0];
            return absUrl + flowService.constructAnchor( targetOrPlace, optionalParameters );
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Returns a copy of the currently active place.
          *
          * @return {Object}
          *    the currently active place
          *
          * @memberOf axFlowService
          */
         place: function() {
            return object.deepClone( activePlace_ );
         }

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return flowService;

   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function decodeExpectedPlaceParameters( parameters, place ) {
      var result = {};
      ng.forEach( place.expectedParameters, function( parameterName ) {
         result[ parameterName ] = decodePlaceParameter( parameters[ parameterName ] );
      } );
      return result;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function placeNameForNavigationTarget( targetOrPlaceName, activePlace ) {
      var placeName = object.path( activePlace, 'targets.' + targetOrPlaceName, targetOrPlaceName );
      if( placeName in places_ ) {
         return placeName;
      }

      log.error( 'Unknown target or place "[0]".', targetOrPlaceName );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function encodePlaceParameter( value ) {
      if( value == null ) {
         return '_';
      }
      return typeof value === 'string' ? value.replace( /\//g, '%2F' ) : value;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function decodePlaceParameter( value ) {
      if( value == null || value === '' || value === '_' ) {
         return null;
      }
      return typeof value === 'string' ? value.replace( /%2F/g, '/' ) : value;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   //
   // Flow Loading tasks
   //
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function loadFlow( flowFile ) {
      return fetchPlaces( flowFile )
         .then( function( places ) {
            places_ = processPlaceParameters( places );

            object.forEach( places_, function( place, routeName ) {
               assembleRoute( routeName, place );
            } );

            $routeProvider_.otherwise( {
               redirectTo: '/entry'
            } );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function assembleRoute( routeName, place ) {
      if( place.redirectTo ) {
         $routeProvider_.when( '/' + routeName, {
            redirectTo: place.redirectTo
         } );
         return;
      }

      if( place.entryPoints ) {
         $routeProvider_.when( '/' + routeName, {
            redirectTo: routeByEntryPoint( place.entryPoints )
         } );
         return;
      }

      if( !place.page && !place.exitPoint ) {
         log.warn( 'flow: invalid empty place: [0]', place.id );
         return;
      }

      $routeProvider_.when( '/' + routeName, {
         template: '<!---->',
         controller: 'AxFlowController',
         resolve: {
            place: function() {
               return place;
            }
         }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function routeByEntryPoint( possibleEntryPoints ) {
      var entryPoint = entryPoint_ || { target: 'default', parameters: {} };

      var placeName = possibleEntryPoints[ entryPoint.target ];
      if( placeName ) {
         var targetPlace = places_[ placeName ];
         var uri = placeName;
         var parameters = entryPoint.parameters || {};

         object.forEach( targetPlace.expectedParameters, function( parameterName ) {
            uri += '/' + encodePlaceParameter( parameters[ parameterName ] );
         } );

         return uri;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var ROUTE_PARAMS_MATCHER = /\/:([^\/]+)/ig;

   function processPlaceParameters( places ) {
      var processedRoutes = {};

      object.forEach( places, function( place, placeName ) {
         place.expectedParameters = [];
         place.id = placeName;

         if( !place.targets ) {
            place.targets = {};
         }
         if( !place.targets[ TARGET_SELF ] ) {
            place.targets[ TARGET_SELF ] = placeName.split( /\/:/ )[0];
         }

         var matches;
         while( ( matches = ROUTE_PARAMS_MATCHER.exec( placeName ) ) ) {
            var routeNameWithoutParams = placeName.substr( 0, matches.index );

            place.expectedParameters.push( matches[ 1 ] );

            processedRoutes[ routeNameWithoutParams ] = place;
         }
         processedRoutes[ placeName ] = place;
      } );

      return processedRoutes;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function fetchPlaces( flowFile ) {
      return fileResourceProvider_.provide( flowFile )
         .then( function( flow ) {
            validateFlowJson( flow );
            return flow.places;
         }, function( err ) {
            throw new Error( 'Failed to load "' + flowFile + '". Cause: ' + err );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function validateFlowJson( flowJson ) {
      var result = jsonValidator.create( flowSchema ).validate( flowJson );

      if( result.errors.length ) {
         result.errors.forEach( function( error ) {
            log.error( '[0]', error.message );
         } );

         throw new Error( 'Illegal flow.json format' );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/loaders/features_provider',[
   '../json/validator',
   '../utilities/object',
   '../utilities/string'
], function( jsonValidator, object, string ) {
   'use strict';

   // JSON schema formats:
   var TOPIC_IDENTIFIER = '([a-z][+a-zA-Z0-9]*|[A-Z][+A-Z0-9]*)';
   var SUB_TOPIC_FORMAT = new RegExp( '^' + TOPIC_IDENTIFIER + '$' );
   var TOPIC_FORMAT = new RegExp( '^(' + TOPIC_IDENTIFIER + '(-' + TOPIC_IDENTIFIER + ')*)$' );
   var FLAG_TOPIC_FORMAT = new RegExp( '^[!]?(' + TOPIC_IDENTIFIER + '(-' + TOPIC_IDENTIFIER + ')*)$' );
   // simplified RFC-5646 language-tag matcher with underscore/dash relaxation:
   // the parts are: language *("-"|"_" script|region|variant) *("-"|"_" extension|privateuse)
   var LANGUAGE_TAG_FORMAT = /^[a-z]{2,8}([-_][a-z0-9]{2,8})*([-_][a-z0-9][-_][a-z0-9]{2,8})*$/i;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function featuresForWidget( widgetSpecification, widgetConfiguration, throwError ) {
      if( !widgetSpecification.features ) {
         return {};
      }

      var featureConfiguration = widgetConfiguration.features || {};
      var featuresSpec = widgetSpecification.features;
      if( !( '$schema' in featuresSpec ) ) {
         // we assume an "old style" feature specification (i.e. first level type specification is omitted)
         // if no schema version was defined.
         featuresSpec = {
            $schema: 'http://json-schema.org/draft-03/schema#',
            type: 'object',
            properties: widgetSpecification.features
         };
      }

      object.forEach( featuresSpec.properties, function( feature, name ) {
         // ensure that simple object/array features are at least defined
         if( name in featureConfiguration ) {
            return;
         }

         if( feature.type === 'object' ) {
            featureConfiguration[ name ] = {};
         }
         else if( feature.type === 'array' ) {
            featureConfiguration[ name ] = [];
         }
      } );

      var validator = createFeaturesValidator( featuresSpec );
      var report = validator.validate( featureConfiguration );

      if( report.errors.length > 0 ) {
         var message = 'Validation for widget features failed. Errors: ';

         report.errors.forEach( function( error ) {
            message += '\n - ' + error.message.replace( /\[/g, '\\[' );
         } );

         throwError( message );
      }

      return featureConfiguration;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createFeaturesValidator( featuresSpec ) {
      var validator = jsonValidator.create( featuresSpec, {
         prohibitAdditionalProperties: true,
         useDefault: true
      } );

      // allows 'mySubTopic0815', 'MY_SUB_TOPIC+OK' and variations:
      validator.addFormat( 'sub-topic', function( subTopic ) {
         return ( typeof subTopic !== 'string' ) || SUB_TOPIC_FORMAT.test( subTopic );
      } );

      // allows 'myTopic', 'myTopic-mySubTopic-SUB_0815+OK' and variations:
      validator.addFormat( 'topic', function( topic ) {
         return ( typeof topic !== 'string' ) || TOPIC_FORMAT.test( topic );
      } );

      // allows 'myTopic', '!myTopic-mySubTopic-SUB_0815+OK' and variations:
      validator.addFormat( 'flag-topic', function( flagTopic ) {
         return ( typeof flagTopic !== 'string' ) || FLAG_TOPIC_FORMAT.test( flagTopic );
      } );

      // allows 'de_DE', 'en-x-laxarJS' and such:
      validator.addFormat( 'language-tag', function( languageTag ) {
         return ( typeof languageTag !== 'string' ) || LANGUAGE_TAG_FORMAT.test( languageTag );
      } );

      // checks that object keys have the 'topic' format
      validator.addFormat( 'topic-map', function( topicMap ) {
         return ( typeof topicMap !== 'object' ) || Object.keys( topicMap ).every( function( topic ) {
            return TOPIC_FORMAT.test( topic );
         } );
      } );

      // checks that object keys have the 'language-tag' format
      validator.addFormat( 'localization', function( localization ) {
         return ( typeof localization !== 'object' ) || Object.keys( localization ).every( function( tag ) {
            return LANGUAGE_TAG_FORMAT.test( tag );
         } );
      } );

      return validator;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      featuresForWidget: featuresForWidget
   };

} );


define("json!laxar/static/schemas/page.json", function(){ return {
   "$schema": "http://json-schema.org/draft-04/schema#",
   "type": "object",
   "properties": {

      "layout": {
         "type": "string",
         "description": "The layout to use. May be omitted if another page in the extension hierarchy defines one."
      },

      "extends": {
         "type": "string",
         "description": "The name of the page to extend."
      },

      "areas": {
         "type": "object",
         "description": "A map from area name to a list of widgets to display within that area.",
         "patternProperties": {
            "^[a-z][\\.a-zA-Z0-9_]*$": {
               "type": "array",
               "items": {
                  "type": "object",
                  "properties": {

                     "widget": {
                        "type": "string",
                        "description": "Path to the widget that should be rendered."
                     },
                     "composition": {
                        "type": "string",
                        "description": "Path to the composition that should be included."
                     },
                     "id": {
                        "type": "string",
                        "pattern": "^[a-z][a-zA-Z0-9_]*$",
                        "description": "ID of the widget or composition. Will be generated if missing."
                     },
                     "insertBeforeId": {
                        "type": "string",
                        "description": "The ID of the widget this widget or composition should be inserted before."
                     },
                     "features": {
                        "type": "object",
                        "description": "Configuration of the features defined by the widget or composition."
                     },
                     "enabled": {
                        "type": "boolean",
                        "default": true,
                        "description": "Set to false to omit widgets e.g. for debugging purposes."
                     }

                  },
                  "additionalProperties": false
               }
            }
         },
         "additionalProperties": false
      }

   },
   "additionalProperties": false
}
;});

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/loaders/page_loader',[
   '../utilities/assert',
   '../utilities/object',
   '../utilities/string',
   '../utilities/path',
   '../json/validator',
   './features_provider',
   'json!../../static/schemas/page.json'
], function( assert, object, string, path, jsonValidator, featuresProvider, pageSchema ) {
   'use strict';

   var SEGMENTS_MATCHER = /[_/-]./g;

   var ID_SEPARATOR = '-';
   var ID_SEPARATOR_MATCHER = /\-/g;
   var SUBTOPIC_SEPARATOR = '+';

   var JSON_SUFFIX_MATCHER = /\.json$/;
   var COMPOSITION_EXPRESSION_MATCHER = /^(!?)\$\{([^}]+)\}$/;
   var COMPOSITION_TOPIC_PREFIX = 'topic:';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function PageLoader( q, httpClient, baseUrl, fileResourceProvider ) {
      this.q_ = q;
      this.httpClient_ = httpClient;
      this.baseUrl_ = baseUrl;
      this.fileResourceProvider_ = fileResourceProvider;
      this.idCounter_ = 0;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Loads a page specification and resolves all extension and compositions. The result is a page were all
    * referenced page fragments are merged in to one JavaScript object. As loading of all relevant files is
    * already asynchronous, this method is also asynchronous and thus returns a promise that is either
    * resolved with the constructed page or rejected with a JavaScript `Error` instance.
    *
    * @param {String} pageName
    *    the page to load. This is in fact a path relative to the base url this page loader was instantiated
    *    with and the `.json` suffix omitted
    *
    * @returns {Promise}
    *    the result promise
    *
    * @private
    */
   PageLoader.prototype.loadPage = function( pageName ) {
      return loadPageRecursively( this, pageName, [] );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function loadPageRecursively( self, pageName, extensionChain ) {
      var page;
      var pageSelfLink = assetUrl( self.baseUrl_, pageName );

      if( extensionChain.indexOf( pageName ) !== -1 ) {
         throwError(
            { name: pageName },
            'Cycle in page extension detected: ' + extensionChain.concat( [ pageName ] ).join( ' -> ' )
         );
      }

      return load( self, pageSelfLink )
         .then( function( foundPage ) {
            validatePage( foundPage, pageName );

            page = foundPage;
            page.name = pageName.replace( JSON_SUFFIX_MATCHER, '' );
            page.selfLink = pageSelfLink;

            if( !page.areas ) {
               page.areas = {};
            }
         }, function() {
            throwError( { name: pageName }, 'Page could not be found at location "' + pageSelfLink + '"' );
         } )
         .then( function() {
            return processExtends( self, page, extensionChain );
         } )
         .then( function() {
            return processCompositions( self, page, [], page );
         } )
         .then( function() {
            return postProcessWidgets( self, page );
         } )
         .then( function() {
            return page;
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   //
   // Processing inheritance (i.e. the `extends` keyword)
   //
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processExtends( self, page, extensionChain ) {
      if( has( page, 'extends' ) ) {
         return loadPageRecursively( self, page[ 'extends' ], extensionChain.concat( [ page.name ] ) )
            .then( function( basePage ) {
               mergePageWithBasePage( page, basePage );
            } );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function mergePageWithBasePage( page, basePage ) {
      var extendingAreas = page.areas;
      var mergedPageAreas = object.deepClone( basePage.areas );
      if( has( basePage, 'layout' ) ) {
         if( has( page, 'layout' ) ) {
            throwError( page, string.format( 'Page overwrites layout set by base page "[name]', basePage ) );
         }
         page.layout = basePage.layout;
      }

      object.forEach( extendingAreas, function( widgets, areaName ) {
         if( !( areaName in mergedPageAreas ) ) {
            mergedPageAreas[ areaName ] = widgets;
            return;
         }

         mergeWidgetLists( mergedPageAreas[ areaName ], widgets, page );
      } );

      page.areas = mergedPageAreas;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   //
   // Processing compositions
   //
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processCompositions( self, page, compositionChain, topPage ) {
      var promise = self.q_.when();
      var seenCompositionIdCount = {};

      object.forEach( page.areas, function( widgets ) {
         /*jshint loopfunc:true*/
         for( var i = widgets.length - 1; i >= 0; --i ) {
            ( function( widgetSpec, index ) {
               if( has( widgetSpec, 'composition' ) ) {
                  if( widgetSpec.enabled === false ) {
                     return;
                  }

                  var compositionName = widgetSpec.composition;
                  if( compositionChain.indexOf( compositionName ) !== -1 ) {
                     var message = 'Cycle in compositions detected: ' +
                                   compositionChain.concat( [ compositionName ] ).join( ' -> ' );
                     throwError( topPage, message );
                  }

                  if( !has( widgetSpec, 'id' ) ) {
                     var escapedCompositionName =
                        widgetSpec.composition.replace( SEGMENTS_MATCHER, dashToCamelcase );
                     widgetSpec.id = nextId( self, escapedCompositionName );
                  }

                  if( widgetSpec.id in seenCompositionIdCount ) {
                     seenCompositionIdCount[ widgetSpec.id ]++;
                  }
                  else {
                     seenCompositionIdCount[ widgetSpec.id ] = 1;
                  }

                  // Loading compositionUrl can be started asynchronously, but replacing the according widgets
                  // in the page needs to take place in order. Otherwise the order of widgets could be messed up.
                  promise = promise
                     .then( function() {
                        return load( self, assetUrl( self.baseUrl_, compositionName ) );
                     } )
                     .then( function( composition ) {
                        return prefixCompositionIds( composition, widgetSpec );
                     } )
                     .then( function( composition ) {
                        return processCompositionExpressions( composition, widgetSpec, throwError.bind( null, topPage ) );
                     } )
                     .then( function( composition ) {
                        var chain = compositionChain.concat( compositionName );
                        return processCompositions( self, composition, chain, topPage )
                           .then( function() {
                              return composition;
                           } );
                     } )
                     .then( function( composition ) {
                        mergeCompositionAreasWithPageAreas( composition, page, widgets, index );
                     } );
               }
            } )( widgets[ i ], i );
         }
      } );

      checkForDuplicateCompositionIds( page, seenCompositionIdCount );

      return promise;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function mergeCompositionAreasWithPageAreas( composition, page, widgets, index ) {
      object.forEach( composition.areas, function( compositionAreaWidgets, areaName ) {
         if( areaName === '.' ) {
            replaceEntryAtIndexWith( widgets, index, compositionAreaWidgets );
            return;
         }

         if( !( areaName in page.areas ) ) {
            page.areas[ areaName ] = compositionAreaWidgets;
            return;
         }

         mergeWidgetLists( page.areas[ areaName ], compositionAreaWidgets, page );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function prefixCompositionIds( composition, widgetSpec ) {
      var prefixedAreas = {};
      object.forEach( composition.areas, function( widgets, areaName ) {
         widgets.forEach( function( widget ) {
            if( has( widget, 'id' ) ) {
               widget.id = widgetSpec.id + ID_SEPARATOR + widget.id;
            }
         } );

         if( areaName.indexOf( '.' ) > 0 ) {
            // All areas prefixed with a local widget id need to be prefixed as well
            prefixedAreas[ widgetSpec.id + ID_SEPARATOR + areaName ] = widgets;
            return;
         }

         prefixedAreas[ areaName ] = widgets;
      } );
      composition.areas = prefixedAreas;
      return composition;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processCompositionExpressions( composition, widgetSpec, throwPageError ) {
      var expressionData = {};

      // feature definitions in compositions may contain generated topics for default resource names or action
      // topics. As such these are generated before instantiating the composition's features.
      composition.features = iterateOverExpressions( composition.features || {}, replaceExpression );
      expressionData.features = featuresProvider.featuresForWidget( composition, widgetSpec, throwPageError );

      if( typeof composition.mergedFeatures === 'object' ) {
         var mergedFeatures = iterateOverExpressions( composition.mergedFeatures, replaceExpression );

         Object.keys( mergedFeatures ).forEach( function( featurePath ) {
            var currentValue = object.path( expressionData.features, featurePath, [] );
            var values = mergedFeatures[ featurePath ];
            object.setPath( expressionData.features, featurePath, values.concat( currentValue ) );
         } );
      }

      composition.areas = iterateOverExpressions( composition.areas, replaceExpression );

      function replaceExpression( subject ) {
         var matches = subject.match( COMPOSITION_EXPRESSION_MATCHER );
         if( !matches ) {
            return subject;
         }

         var possibleNegation = matches[1];
         var expression = matches[2];
         var result;
         if( expression.indexOf( COMPOSITION_TOPIC_PREFIX ) === 0 ) {
            result = topicFromId( widgetSpec.id ) +
               SUBTOPIC_SEPARATOR + expression.substr( COMPOSITION_TOPIC_PREFIX.length );
         }
         else {
            result = object.path( expressionData, expression );
         }

         return typeof result === 'string' && possibleNegation ? possibleNegation + result : result;
      }

      return composition;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function iterateOverExpressions( obj, replacer ) {
      if( obj === null ) {
         return obj;
      }

      if( Array.isArray( obj ) ) {
         return obj.map( function( value ) {
            if( typeof value === 'object' ) {
               return iterateOverExpressions( value, replacer );
            }

            return typeof value === 'string' ? replacer( value ) : value;
         } ).filter( function( item ) {
            return typeof item !== 'undefined';
         } );
      }

      var result = {};
      object.forEach( obj, function( value, key ) {
         var replacedKey = replacer( key );
         if( typeof value === 'object' ) {
            result[ replacedKey ] = iterateOverExpressions( value, replacer );
            return;
         }

         var replacedValue = typeof value === 'string' ? replacer( value ) : value;
         if( typeof replacedValue !== 'undefined' ) {
            result[ replacedKey ] = replacedValue;
         }
      } );

      return result;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function checkForDuplicateCompositionIds( page, idCount ) {
      var duplicates = Object.keys( idCount ).filter( function( compositionId ) {
         return idCount[ compositionId ] > 1;
      } );

      if( duplicates.length ) {
         throwError( page, 'Duplicate composition ID(s): ' + duplicates.join( ', ' ) );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   //
   // Additional Tasks
   //
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function postProcessWidgets( self, page ) {
      var idCount = {};

      object.forEach( page.areas, function( widgetList, index ) {
         page.areas[ index ] = widgetList.filter( function( widgetSpec ) {
            if( widgetSpec.enabled === false ) {
               return false;
            }

            if( has( widgetSpec, 'widget' ) ) {
               if( !has( widgetSpec, 'id' ) ) {
                  var widgetName = widgetSpec.widget.split( '/' ).pop();
                  widgetSpec.id = nextId( self, widgetName.replace( SEGMENTS_MATCHER, dashToCamelcase ) );
               }

               idCount[ widgetSpec.id ] = idCount[ widgetSpec.id ] ? idCount[ widgetSpec.id ] + 1 : 1;
            }
            return true;
         } );
      } );

      var duplicates = Object.keys( idCount ).filter( function( widgetId ) {
         return idCount[ widgetId ] > 1;
      } );

      if( duplicates.length ) {
         throwError( page, 'Duplicate widget ID(s): ' + duplicates.join( ', ' ) );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function validatePage( foundPage, pageName ) {
      var result = jsonValidator.create( pageSchema ).validate( foundPage );
      if( result.errors.length ) {
         var errorString = result.errors.reduce( function( errorString, errorItem ) {
            return errorString + '\n - ' + errorItem.message;
         }, '' );

         throwError( { name: pageName }, 'Schema validation failed: ' + errorString );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   //
   // Common functionality and utility functions
   //
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function mergeWidgetLists( targetList, sourceList, page ) {
      sourceList.forEach( function( widgetConfiguration ) {
         if( widgetConfiguration.insertBeforeId ) {
            for( var i = 0, length = targetList.length; i < length; ++i ) {
               if( targetList[ i ].id === widgetConfiguration.insertBeforeId ) {
                  targetList.splice( i, 0, widgetConfiguration );
                  return;
               }
            }

            throwError( page,
               string.format(
                  'No id found that matches insertBeforeId value "[insertBeforeId]"',
                  widgetConfiguration
               )
            );
         }

         targetList.push( widgetConfiguration );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function assetUrl( base, asset ) {
      if( !asset.match( JSON_SUFFIX_MATCHER ) ) {
         asset += '.json';
      }
      return path.join( base, asset );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function has( object, what ) {
      return typeof object[ what ] === 'string' && object[ what ].length;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function load( self, url ) {
      if( !self.fileResourceProvider_ ) {
         return self.httpClient_.get( url ).then( function( response ) {
            return response.data;
         } );
      }
      return self.fileResourceProvider_.provide( url );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function nextId( self, prefix ) {
      return prefix + ID_SEPARATOR + 'id' + self.idCounter_++;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function dashToCamelcase( segmentStart ) {
      return segmentStart.charAt( 1 ).toUpperCase();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function topicFromId( id ) {
      return id.replace( ID_SEPARATOR_MATCHER, SUBTOPIC_SEPARATOR ).replace( SEGMENTS_MATCHER, dashToCamelcase );
   }

   function replaceEntryAtIndexWith( arr, index, replacements ) {
      arr.splice.apply( arr, [ index, 1 ].concat( replacements ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function throwError( page, message ) {
      var text = string.format( 'Error loading page "[name]": [0]', [ message ], page );
      throw new Error( text );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      /**
       * Creates and returns a new page loader instance.
       *
       * @param {Object} q
       *    a Promise library conforming to $q from AngularJS
       * @param {Object} httpClient
       *    a http client conforming to $http from AngularJS
       * @param {String} baseUrl
       *    the url where all pages are located
       * @param {FileResourceProvider} fileResourceProvider
       *    a FileResourceProvider as a smarter alternative to httpClient, used if provided
       * @returns {PageLoader}
       *    a page loader instance
       *
       * @private
       */
      create: function( q, httpClient, baseUrl, fileResourceProvider ) {
         assert( q ).isNotNull();
         if( fileResourceProvider === null ) {
            assert( httpClient ).isNotNull();
         }
         assert( baseUrl ).isNotNull();
         return new PageLoader( q, httpClient, baseUrl, fileResourceProvider );
      }

   };

} );

/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/widget_adapters/plain_adapter',[], function() {
   'use strict';

   var widgetModules = {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function bootstrap( modules ) {
      modules.forEach( function( module ) {
         widgetModules[ module.name ] = module;
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param {Object}      environment
    * @param {HTMLElement} environment.anchorElement
    * @param {Object}      environment.context
    * @param {EventBus}    environment.context.eventBus
    * @param {Object}      environment.context.features
    * @param {Function}    environment.context.id
    * @param {Object}      environment.context.widget
    * @param {String}      environment.context.widget.area
    * @param {String}      environment.context.widget.id
    * @param {String}      environment.context.widget.path
    * @param {Object}      environment.specification
    *
    * @return {Object}
    */
   function create( environment ) {

      var exports = {
         createController: createController,
         domAttachTo: domAttachTo,
         domDetach: domDetach,
         destroy: function() {}
      };

      var widgetName = environment.specification.name;
      var moduleName = widgetName.replace( /^./, function( _ ) { return _.toLowerCase(); } );
      var context = environment.context;
      var controller = null;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createController() {
         var module = widgetModules[ moduleName ];
         var injector = createInjector();
         var injections = ( module.injections || [] ).map( function( injection ) {
            return injector.get( injection );
         } );

         controller = module.create.apply( module, injections );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function domAttachTo( areaElement, htmlTemplate ) {
         if( htmlTemplate === null ) {
            return;
         }
         environment.anchorElement.innerHTML = htmlTemplate;
         areaElement.appendChild( environment.anchorElement );
         controller.renderTo( environment.anchorElement );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function domDetach() {
         var parent = environment.anchorElement.parentNode;
         if( parent ) {
            parent.removeChild( environment.anchorElement );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createInjector() {
         var map = {
            axContext: context,
            axEventBus: context.eventBus,
            axFeatures: context.features || {}
         };

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         return {
            get: function( name ) {
               if( !( name in map ) ) {
                  throw new Error( 'Unknown dependency "' + name + '".' );
               }
               return map[ name ];
            }
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return exports;

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      technology: 'plain',
      bootstrap: bootstrap,
      create: create
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/widget_adapters/angular_adapter',[
   'angular',
   'require',
   '../utilities/assert',
   '../logging/log'
], function( ng, require, assert, log ) {
   'use strict';

   var $compile;
   var $controller;
   var $rootScope;

   var controllerNames = {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function bootstrap( widgetModules ) {
      var dependencies = ( widgetModules || [] ).map( function( module ) {
         controllerNames[ module.name ] = capitalize( module.name ) + 'Controller';
         supportPreviousNaming( module.name );
         return module.name;
      } );

      return ng.module( 'axAngularWidgetAdapter', dependencies )
         .run( [ '$compile', '$controller', '$rootScope', function( _$compile_, _$controller_, _$rootScope_ ) {
            $controller = _$controller_;
            $compile = _$compile_;
            $rootScope = _$rootScope_;
         } ] );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param {Object}      environment
    * @param {HTMLElement} environment.anchorElement
    * @param {Object}      environment.context
    * @param {EventBus}    environment.context.eventBus
    * @param {Object}      environment.context.features
    * @param {Function}    environment.context.id
    * @param {Object}      environment.context.widget
    * @param {String}      environment.context.widget.area
    * @param {String}      environment.context.widget.id
    * @param {String}      environment.context.widget.path
    * @param {Object}      environment.specification
    *
    * @return {Object}
    */
   function create( environment ) {

      var exports = {
         createController: createController,
         domAttachTo: domAttachTo,
         domDetach: domDetach,
         destroy: destroy
      };

      var context = environment.context;
      var scope_;
      var injections_;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createController() {
         var widgetName = environment.specification.name;
         var moduleName = widgetName.replace( /^./, function( _ ) { return _.toLowerCase(); } );
         var controllerName = controllerNames[ moduleName ];

         injections_ = {
            axContext: context,
            axEventBus: context.eventBus
         };
         Object.defineProperty( injections_, '$scope', {
            get: function() {
               if( !scope_ ) {
                  scope_ = $rootScope.$new();
                  ng.extend( scope_, context );
               }
               return scope_;
            }
         } );

         $controller( controllerName, injections_ );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Synchronously attach the widget DOM to the given area.
       *
       * @param {HTMLElement} areaElement
       *    The widget area to attach this widget to.
       * @param {String} templateHtml
       *
       */
      function domAttachTo( areaElement, templateHtml ) {
         if( templateHtml === null ) {
            return;
         }

         var element = ng.element( environment.anchorElement );
         element.html( templateHtml );
         areaElement.appendChild( environment.anchorElement );
         $compile( environment.anchorElement )( injections_.$scope );
         templateHtml = null;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function domDetach() {
         var parent = environment.anchorElement.parentNode;
         if( parent ) {
            parent.removeChild( environment.anchorElement );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function destroy() {
         if( scope_ ) {
            scope_.$destroy();
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return exports;

   }


   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function capitalize( _ ) {
      return _.replace( /^./, function( _ ) { return _.toUpperCase(); } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function supportPreviousNaming( moduleName ) {
      if( moduleName.indexOf( '.' ) === -1 ) {
         return;
      }

      var lookupName = moduleName.replace( /^.*\.([^.]+)$/, function( $_, $1 ) {
         return $1.replace( /_(.)/g, function( $_, $1 ) { return $1.toUpperCase(); } );
      } );
      controllerNames[ lookupName ] = controllerNames[ moduleName ] = moduleName + '.Controller';

      log.warn( 'Deprecation: AngularJS widget module name "' + moduleName + '" violates naming rules! ' +
                'Module should be named "' + lookupName + '". ' +
                'Controller should be named "' + capitalize( lookupName ) + 'Controller".' );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      technology: 'angular',
      bootstrap: bootstrap,
      create: create
   };

} );

/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/widget_adapters/adapters',[
   './plain_adapter',
   './angular_adapter'
], function( plainAdapter, angularAdapter ) {
   'use strict';

   var adapters = {};
   adapters[ plainAdapter.technology ] = plainAdapter;
   adapters[ angularAdapter.technology ] = angularAdapter;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      getFor: function( technology ) {
         return adapters[ technology ];
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      addAdapters: function( additionalAdapters ) {
         additionalAdapters.forEach( function( adapter ) {
            adapters[ adapter.technology ] = adapter;
         } );
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/loaders/widget_loader',[
   '../logging/log',
   '../utilities/path',
   '../utilities/assert',
   '../utilities/object',
   '../utilities/string',
   './paths',
   './features_provider',
   '../widget_adapters/adapters'
], function( log, path, assert, object, string, paths, featuresProvider, adapters ) {
   'use strict';

   var TYPE_WIDGET = 'widget';
   var TYPE_ACTIVITY = 'activity';
   var TECHNOLOGY_ANGULAR = 'angular';

   var DEFAULT_INTEGRATION = { type: TYPE_WIDGET, technology: TECHNOLOGY_ANGULAR };

   var ID_SEPARATOR = '-';
   var INVALID_ID_MATCHER = /[^A-Za-z0-9_\.-]/g;

   /**
    * @typedef {{then: Function}} Promise
    *
    * @param q
    * @param fileResourceProvider
    * @param themeManager
    * @param cssLoader
    * @param eventBus
    * @returns {{load: Function}}
    */
   function create( q, fileResourceProvider, themeManager, cssLoader, eventBus ) {

      return {
         load: load
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Load a widget using an appropriate adapter
       *
       * First, get the given widget's specification to validate and instantiate the widget features.
       * Then, instantiate a widget adapter matching the widget's technology. Using the adapter, create the
       * widget controller. The adapter is returned and can be used to attach the widget to the DOM, or to
       * destroy it.
       *
       * @param {Object} widgetConfiguration
       *    a widget instance configuration (as used in page definitions) to instantiate the widget from
       *
       * @return {Promise} a promise for a widget adapter, with an already instantiated controller
       */
      function load( widgetConfiguration ) {
         var widgetPath = widgetConfiguration.widget;
         var widgetJsonPath = path.join( paths.WIDGETS, widgetPath, 'widget.json' );

         return fileResourceProvider.provide( widgetJsonPath )
            .then( function( specification ) {
               var integration = object.options( specification.integration, DEFAULT_INTEGRATION );
               var type = integration.type;
               var technology = integration.technology;
               // Handle legacy widget code:
               if( type === TECHNOLOGY_ANGULAR ) {
                  type = TYPE_WIDGET;
               }
               if( type !== TYPE_WIDGET && type !== TYPE_ACTIVITY ) {
                  throwError( widgetConfiguration, 'unknown integration type ' + type );
               }

               var throwWidgetError = throwError.bind( null, widgetConfiguration );
               var features =
                  featuresProvider.featuresForWidget( specification, widgetConfiguration, throwWidgetError );
               var anchorElement = document.createElement( 'DIV' );
               anchorElement.className = camelCaseToDashed( specification.name );
               anchorElement.id = 'ax' + ID_SEPARATOR + widgetConfiguration.id;
               var widgetEventBus = createEventBusForWidget( eventBus, specification, widgetConfiguration );

               var adapter = adapters.getFor( technology ).create( {
                  anchorElement: anchorElement,
                  context: {
                     eventBus: widgetEventBus,
                     features: features,
                     id: createIdGeneratorForWidget( widgetConfiguration.id ),
                     widget: {
                        area: widgetConfiguration.area,
                        id: widgetConfiguration.id,
                        path: widgetConfiguration.widget
                     }
                  },
                  specification: specification
               } );
               adapter.createController();

               return {
                  id: widgetConfiguration.id,
                  adapter: adapter,
                  destroy: function() {
                     widgetEventBus.release();
                     adapter.destroy();
                  },
                  templatePromise: loadAssets( widgetPath, integration, specification )
               };

            }, function( err ) {
               var message = 'Could not load spec for widget [0] from [1]: [2]';
               log.error( message, widgetPath, widgetJsonPath, err );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Locates and loads the widget HTML template for this widget (if any) as well as any CSS stylesheets
       * used by this widget or its controls.
       *
       * @param widgetReferencePath
       *    The path suffix used to look up the widget, as given in the instance configuration.
       * @param integration
       *    Details on the integration type and technology: Activities do not require assets.
       * @param widgetSpecification
       *    The widget specification, used to find out if any controls need to be loaded.
       *
       * @return {Promise<String>}
       *    A promise that will be resolved with the contents of any HTML template for this widget, or with
       *    `null` if there is no template (for example, if this is an activity).
       */
      function loadAssets( widgetReferencePath, integration, widgetSpecification ) {

         return integration.type === TYPE_ACTIVITY ? q.when( null ) : resolve().then( function( urls ) {
            urls.cssFileUrls.forEach( function( url ) { cssLoader.load( url ); } );
            return urls.templateUrl ? fileResourceProvider.provide( urls.templateUrl ) : null;
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function resolve() {
            var technicalName = widgetReferencePath.split( '/' ).pop();
            var widgetPath = path.join( paths.WIDGETS, widgetReferencePath );
            var htmlFile = technicalName + '.html';
            var cssFile = path.join( 'css/', technicalName + '.css' );

            var promises = [];
            promises.push( themeManager.urlProvider(
               path.join( widgetPath, '[theme]' ),
               path.join( paths.THEMES, '[theme]', 'widgets', widgetReferencePath )
            ).provide( [ htmlFile, cssFile ] ) );

            promises = promises.concat( ( widgetSpecification.controls || [] )
               .map( function( controlReference ) {
                  // By appending a path now and .json afterwards, trick RequireJS into generating the
                  // correct descriptor path when loading from a 'package'.
                  var controlLocation = path.normalize( require.toUrl( path.join( controlReference, 'control' ) ) );
                  var descriptorUrl = controlLocation + '.json';
                  return fileResourceProvider.provide( descriptorUrl ).then( function( descriptor ) {
                     // LaxarJS 1.x style control (name determined from descriptor):
                     var name = camelCaseToDashed( descriptor.name );
                     return themeManager.urlProvider(
                        path.join( controlLocation.replace( /\/control$/, '' ), '[theme]' ),
                        path.join( paths.THEMES, '[theme]', 'controls', name )
                     ).provide( [ path.join( 'css/',  name + '.css' ) ] );
                  },
                  function() {
                     // LaxarJS 0.x style controls (no descriptor, uses AMD path as name):
                     var name = controlReference.split( '/' ).pop();
                     return themeManager.urlProvider(
                        path.join( require.toUrl( controlReference ), '[theme]' ),
                        path.join( paths.THEMES, '[theme]', controlReference )
                     ).provide( [ path.join( 'css/', name + '.css' ) ] );
                  } );
               } ) );

            return q.all( promises )
               .then( function( results ) {
                  var widgetUrls = results[ 0 ];
                  var cssUrls = results.slice( 1 )
                     .map( function( urls ) { return urls[ 0 ]; } )
                     .concat( widgetUrls.slice( 1 ) )
                     .filter( function( url ) { return !!url; } );

                  return {
                     templateUrl: widgetUrls[ 0 ] || '',
                     cssFileUrls: cssUrls
                  };
               } );
         }
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function camelCaseToDashed( str ) {
      return str.replace( /[A-Z]/g, function( character, offset ) {
         return ( offset > 0 ? '-' : '' ) + character.toLowerCase();
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function throwError( widgetConfiguration, message ) {
      throw new Error( string.format(
         'Error loading widget "[widget]" (id: "[id]"): [0]', [ message ], widgetConfiguration
      ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createIdGeneratorForWidget( widgetId ) {
      var charCodeOfA = 'a'.charCodeAt( 0 );
      function fixLetter( l ) {
         // We map invalid characters deterministically to valid lower case letters. Thereby a collision of
         // two ids with different invalid characters at the same positions is less likely to occur.
         return String.fromCharCode( charCodeOfA + l.charCodeAt( 0 ) % 26 );
      }

      var prefix = 'ax' + ID_SEPARATOR + widgetId.replace( INVALID_ID_MATCHER, fixLetter ) + ID_SEPARATOR;
      return function( localId ) {
         return prefix + ( '' + localId ).replace( INVALID_ID_MATCHER, fixLetter );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createEventBusForWidget( eventBus, widgetSpecification, widgetConfiguration ) {

      var collaboratorId = 'widget.' + widgetSpecification.name + '#' + widgetConfiguration.id;

      function forward( to ) {
         return function() {
            return eventBus[ to ].apply( eventBus, arguments );
         };
      }

      function augmentOptions( optionalOptions ) {
         return object.options( optionalOptions, { sender: collaboratorId } );
      }

      var subscriptions = [];
      function unsubscribe( subscriber ) {
         eventBus.unsubscribe( subscriber );
      }

      return {
         addInspector: forward( 'addInspector' ),
         setErrorHandler: forward( 'setErrorHandler' ),
         setMediator: forward( 'setMediator' ),
         unsubscribe: unsubscribe,
         subscribe: function( eventName, subscriber, optionalOptions ) {
            subscriptions.push( subscriber );

            var options = object.options( optionalOptions, { subscriber: collaboratorId } );

            eventBus.subscribe( eventName, subscriber, options );
         },
         publish: function( eventName, optionalEvent, optionalOptions ) {
            return eventBus.publish( eventName, optionalEvent, augmentOptions( optionalOptions ) );
         },
         publishAndGatherReplies: function( eventName, optionalEvent, optionalOptions ) {
            return eventBus.publishAndGatherReplies( eventName, optionalEvent, augmentOptions( optionalOptions ) );
         },
         release: function() {
            subscriptions.forEach( unsubscribe );
         }
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      create: create
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/runtime/area_helper',[
   'angular'
], function( ng ) {
   'use strict';

   /**
    * The area helper manages widget areas, their DOM representation and their nesting structure.
    *
    * It tracks widget area visibility in order to compile widgets and to attach them to their areas when
    * these become visible. It also tells the visibility service when change handlers need to be run. It does
    * not interact with the event bus directly, but is consulted by the visibility manager to determine area
    * nesting for visibility events.
    */
   function create( q, page, visibilityService ) {

      var exports = {
         setVisibility: setVisibility,
         areasInArea: areasInArea,
         areasInWidget: areasInWidget,
         register: register,
         exists: exists,
         attachWidgets: attachWidgets
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      // forget about any visibility handlers/state from a previous page
      visibilityService._reset();

      // all initially visible widgets should be attached together, to reduce jitter and unnecessary DOM ops
      var freeToAttach = false;

      // keep the dom element for each area, to attach widgets to
      var areaToElement = {};

      // track widget adapters waiting for their area to become available so that they may attach to its DOM
      var areaToWaitingAdapters = {};

      // the area name for each widget
      var widgetIdToArea = {};
      ng.forEach( page.areas, function( widgets, areaName ) {
         widgets.forEach( function( widget ) {
            widgetIdToArea[ widget.id ] = areaName;
         } );
      } );

      // for each widget with children, and each widget area with nested areas, store a list of child names
      var areasInAreaMap = {};
      var areasInWidgetMap = {};
      ng.forEach( page.areas, function( widgetEntries, areaName ) {
         var containerName = '';
         if( areaName.indexOf( '.' ) !== -1 ) {
            var widgetId = areaName.split( '.' )[ 0 ];
            areasInWidgetMap[ widgetId ] = areasInWidgetMap[ widgetId ] || [];
            areasInWidgetMap[ widgetId ].push( areaName );
            containerName = widgetIdToArea[ widgetId ];
         }
         areasInAreaMap[ containerName ] = areasInAreaMap[ containerName ] || [];
         areasInAreaMap[ containerName ].push( areaName );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setVisibility( areaName, visible ) {
         if( visible && freeToAttach ) {
            attachWaitingAdapters( areaName );
         }
         visibilityService._updateState( areaName, visible );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function areasInArea( containerName ) {
         return areasInAreaMap[containerName];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function areasInWidget( widgetId ) {
         return areasInWidgetMap[ widgetId ];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Register a widget area
       *
       * @param {String} name
       *    the area name as used in the page definition
       * @param {HTMLElement} element
       *    an HTML element representing the widget area
       */
      function register( name, element ) {
         if( name in areaToElement ) {
            throw new Error( 'The area "' + name + '" is defined twice in the current layout.' );
         }

         areaToElement[ name ] = element;
         if( freeToAttach && visibilityService.isVisible( name ) ) {
            attachWaitingAdapters( name );
         }
         return function() {
            delete areaToElement[ name ];
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function exists( name ) {
         return name in areaToElement;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function attachWidgets( widgetAdapters ) {
         freeToAttach = true;
         widgetAdapters.forEach( function( adapterRef ) {
            var areaName = widgetIdToArea[ adapterRef.id ];
            areaToWaitingAdapters[ areaName ] = areaToWaitingAdapters[ areaName ] || [];
            areaToWaitingAdapters[ areaName ].push( adapterRef );
         } );
         ng.forEach( page.areas, function( widgets, areaName ) {
            if( visibilityService.isVisible( areaName ) ) {
               attachWaitingAdapters( areaName );
            }
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /** @private */
      function attachWaitingAdapters( areaName ) {
         var waitingAdapters = areaToWaitingAdapters[ areaName ];
         if( !waitingAdapters || !waitingAdapters.length ) { return; }
         var element = areaToElement[ areaName ];
         if( !element ) { return; }

         q.all( waitingAdapters.map( function( adapterRef ) {
            // Make sure that all assets are available before proceeding, so that DOM update happens en bloc.
            return adapterRef.templatePromise;
         } ) )
            .then( function( htmlTemplates ) {
               // prepare first/last bootstrap classes for appending widgets
               var currentLast = element.lastChild;
               if( currentLast ) { ng.element( currentLast ).removeClass( 'last' ); }
               var currentFirst = element.firstChild;

               waitingAdapters.forEach( function( adapterRef, i ) {
                  adapterRef.adapter.domAttachTo( element, htmlTemplates[ i ] );
               } );

               // fix first/last bootstrap classes as needed
               if( !currentFirst ) {
                  var first = element.firstChild;
                  if( first ) { first.className += ' first'; }
               }
               var last = element.lastChild;
               if( last ) { last.className += ' last'; }
            } );

         delete areaToWaitingAdapters[ areaName ];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return exports;

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return create;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/runtime/locale_event_manager',[
   '../utilities/object'
], function( object ) {
   'use strict';

   var senderOptions = { sender: 'AxPageController' };
   var subscriberOptions = { subscriber: 'AxPageController' };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * The LocaleManager initializes the locale(s) and implements changes to them.
    *
    * Before publishing the state of all configured locales, it listens to change requests, allowing
    * widgets and activities (such as a LocaleSwitcherWidget) to influence the state of locales before
    * the navigation is complete.
    */
   function create( $q, eventBus, configuration ) {

      var exports = {
         initialize: initialize,
         subscribe: subscribe,
         unsubscribe: unsubscribe
      };

      var configLocales_ = configuration.get( 'i18n.locales', { 'default': 'en' } );
      var i18n;
      var initialized;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleRequest( event ) {
         i18n[ event.locale ] = event.languageTag;
         if( initialized ) {
            publish( event.locale );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publish( locale ) {
         var event = { locale: locale, languageTag: i18n[ locale ] };
         return eventBus.publish( 'didChangeLocale.' + locale, event, senderOptions );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function initialize() {
         initialized = true;
         return $q.all( Object.keys( configLocales_ ).map( publish ) );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function unsubscribe() {
         eventBus.unsubscribe( handleRequest );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function subscribe() {
         i18n = object.deepClone( configLocales_ );
         initialized = false;

         eventBus.subscribe( 'changeLocaleRequest', handleRequest, subscriberOptions );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return exports;

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return create;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/runtime/visibility_event_manager',[], function() {
   'use strict';

   var senderOptions = { sender: 'AxPageController', deliverToSender: false };
   var subscriberOptions = { subscriber: 'AxPageController' };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * The visibility event manager initializes and coordinates events for widget area visibility.
    *
    * It subscribes to all visibility changes and propagates them to nested widget areas
    * (if applicable). It is not concerned with the resulting DOM-visibility of individual controls:
    * the `axVisibilityService` takes care of that.
    *
    * @return {{initialize: Function}}
    *    a function to trigger initialization of the manager and initial widget visibility
    */
   function create( $q, eventBus ) {

      var exports = {
         initialize: initialize,
         setAreaHelper: setAreaHelper,
         unsubscribe: unsubscribe
      };

      var areaHelper_;
      var ROOT = '';

      function setAreaHelper( areaHelper ) {
         areaHelper_ = areaHelper;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function initialize() {
         // broadcast visibility changes in individual widgets to their nested areas
         eventBus.subscribe( 'changeWidgetVisibilityRequest', handleChangeWidgetRequest, subscriberOptions );

         // broadcast visibility changes in widget areas to their nested areas
         eventBus.subscribe( 'changeAreaVisibilityRequest', handleChangeAreaRequest, subscriberOptions );

         implementAreaChange( ROOT, true );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleChangeWidgetRequest( event ) {
         var affectedAreas = areaHelper_.areasInWidget( event.widget );
         var will = [ 'willChangeWidgetVisibility', event.widget, event.visible ].join( '.' );
         var did = [ 'didChangeWidgetVisibility', event.widget, event.visible ].join( '.' );

         eventBus.publish( will, event, senderOptions );

         $q.all( ( affectedAreas || [] ).map( event.visible ? show : hide ) )
            .then( function() {
               eventBus.publish( did, event, senderOptions );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleChangeAreaRequest( event ) {
         return initiateAreaChange( event.area, event.visible );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function show( area ) {
         return requestAreaChange( area, true );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function hide( area ) {
         return requestAreaChange( area, false );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * First, publish a `changeAreaVisibilityRequest` to ask if some widget would like to manage the
       * given area's visibility.
       * If no widget responds, self-issue a will/did-response to notify interested widgets in the area
       * of their new visibility status.
       * In either case, manage the propagation to nested areas and inform the area helper so that it
       * may compile and attach the templates of any newly visible widgets.
       *
       * @param {String} area
       *    the area whose visibility to update
       * @param {Boolean} visible
       *    the new visibility state of the given area, to the best knowledge of the client
       */
      function requestAreaChange( area, visible ) {
         var request = [ 'changeAreaVisibilityRequest', area ].join( '.' );
         var event = { area: area, visible: visible };
         return eventBus.publishAndGatherReplies( request, event, senderOptions )
            .then( function( responses ) {
               if( responses.length === 0 ) {
                  // no one took responsibility, so the event manager determines visibility by area nesting
                  return initiateAreaChange( area, visible );
               }
               // assume the first 'did'-response to be authoritative:
               var response = responses[ 0 ];
               return implementAreaChange( area, response.event.visible );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Set the new visibility state for the given area, then issue requests for the child areas.
       * Inform the area helper so that it may compile and attach the templates of any newly visible
       * widgets.
       */
      function initiateAreaChange( area, visible ) {
         var will = [ 'willChangeAreaVisibility', area, visible ].join( '.' );
         var event = { area: area, visible: visible };
         eventBus.publish( will, event, senderOptions )
            .then( function() {
               return implementAreaChange( area, visible );
            } )
            .then( function() {
               var did = [ 'didChangeAreaVisibility', area, visible ].join( '.' );
               return eventBus.publish( did, event, senderOptions );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function implementAreaChange( ofArea, areaVisible ) {
         areaHelper_.setVisibility( ofArea, areaVisible );
         var children = areaHelper_.areasInArea( ofArea );
         if( !children ) {
            return $q.when();
         }

         return $q.all( children.map( areaVisible ? show : hide ) );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function unsubscribe() {
         eventBus.unsubscribe( handleChangeAreaRequest );
         eventBus.unsubscribe( handleChangeWidgetRequest );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return exports;

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return create;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/runtime/page',[
   'angular',
   '../utilities/assert',
   '../directives/layout/layout',
   '../loaders/page_loader',
   '../loaders/widget_loader',
   '../loaders/paths',
   './area_helper',
   './locale_event_manager',
   './visibility_event_manager'
], function( ng, assert, layoutModule, pageLoader, widgetLoader, paths, createAreaHelper, createLocaleEventManager, createVisibilityEventManager ) {
   'use strict';

   var module = ng.module( 'axPage', [ layoutModule.name ] );

   /** Delay between sending didLifeCycle and attaching widget templates. */
   var WIDGET_ATTACH_DELAY_MS = 5;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Mediates between the AxFlowController which has no ties to the DOM and the stateful AxPageController
    */
   module.service( 'axPageService', [ function() {

      var pageController;

      return {
         controller: function() {
            return pageController;
         },
         registerPageController: function( controller ) {
            pageController = controller;
            return function() {
               pageController = null;
            };
         },
         controllerForScope: function( scope ) {
            return pageController;
         }
      };

   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Manages widget adapters and their DOM for the current page
    */
   module.controller( 'AxPageController', [
      '$scope', '$q', '$timeout', 'axPageService', 'axVisibilityService', 'axConfiguration', 'axCssLoader', 'axLayoutLoader', 'axGlobalEventBus', 'axFileResourceProvider', 'axThemeManager',
      function( $scope, $q, $timeout , pageService, visibilityService, configuration, cssLoader, layoutLoader, eventBus, fileResourceProvider, themeManager ) {

         var self = this;
         var pageLoader_ = pageLoader.create( $q, null, paths.PAGES, fileResourceProvider );

         var areaHelper_;
         var widgetAdapters_ = [];

         var theme = themeManager.getTheme();
         var localeManager = createLocaleEventManager( $q, eventBus, configuration );
         var visibilityManager = createVisibilityEventManager( $q, eventBus );
         var lifecycleEvent = { lifecycleId: 'default' };
         var senderOptions = { sender: 'AxPageController' };

         var renderLayout = function( layoutInfo ) {
            assert.codeIsUnreachable( 'No renderer for page layout ' + layoutInfo.className );
         };

         var cleanup = pageService.registerPageController( this );
         $scope.$on( '$destroy', cleanup );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function widgetsForPage( page ) {
            var widgets = [];
            ng.forEach( page.areas, function( area, areaName ) {
               area.forEach( function( widget ) {
                  widget.area = areaName;
                  widgets.push( widget );
               } );
            } );
            return widgets;
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function beginLifecycle() {
            return eventBus.publishAndGatherReplies(
               'beginLifecycleRequest.default',
               lifecycleEvent,
               senderOptions );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function publishTheme() {
            return eventBus.publish( 'didChangeTheme.' + theme, { theme: theme }, senderOptions );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         /**
          * Instantiate all widget controllers on this page, and then load their UI.
          *
          * @return {Promise}
          *    A promise that is resolved when all controllers have been instantiated, and when the initial
          *    events have been sent.
          */
         function setupPage( pageName ) {
            var widgetLoader_ = widgetLoader.create( $q, fileResourceProvider, themeManager, cssLoader, eventBus );

            var layoutDeferred = $q.defer();
            var pagePromise = pageLoader_.loadPage( pageName )
               .then( function( page ) {
                  areaHelper_ = createAreaHelper( $q, page, visibilityService );
                  visibilityManager.setAreaHelper( areaHelper_ );
                  self.areas = areaHelper_;
                  layoutLoader.load( page.layout ).then( layoutDeferred.resolve );

                  localeManager.subscribe();
                  // instantiate controllers
                  var widgets = widgetsForPage( page );
                  return $q.all( widgets.map( widgetLoader_.load ) );
               } )
               .then( function( widgetAdapters ) {
                  widgetAdapters_ = widgetAdapters;
               } )
               .then( localeManager.initialize )
               .then( publishTheme )
               .then( beginLifecycle )
               .then( visibilityManager.initialize );

            var layoutReady = layoutDeferred.promise.then( function( result ) {
               // function wrapper is necessary here to dereference `renderlayout` _after_ the layout is ready
               renderLayout( result );
            } );

            // Give the widgets (a little) time to settle on the event bus before $digesting and painting:
            var widgetsInitialized = pagePromise.then( function() {
               return $timeout( function(){}, WIDGET_ATTACH_DELAY_MS, false );
            } );

            return $q.all( [ layoutReady, widgetsInitialized ] )
               .then( function() {
                  areaHelper_.attachWidgets( widgetAdapters_ );
               } );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function tearDownPage() {
            visibilityManager.unsubscribe();
            localeManager.unsubscribe();

            return eventBus
               .publishAndGatherReplies( 'endLifecycleRequest.default', lifecycleEvent, senderOptions )
               .then( function() {
                  widgetAdapters_.forEach( function( adapterRef ) {
                     adapterRef.destroy();
                  } );
                  widgetAdapters_ = [];
               } );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function registerLayoutRenderer( render ) {
            renderLayout = render;
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         this.setupPage = setupPage;
         this.tearDownPage = tearDownPage;
         this.registerLayoutRenderer = registerLayoutRenderer;
      }

   ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.directive( 'axPage', [ '$compile', function( $compile ) {

      var defaultAreas = [
         { name: 'activities', hidden: true },
         { name: 'popups' },
         { name: 'popovers' }
      ];

      return {
         restrict: 'A',
         template: '<div data-ng-class="layoutClass"></div>',
         replace: true,
         scope: true,
         controller: 'AxPageController',
         link: function( scope, element, attrs, controller ) {

            controller.registerLayoutRenderer( function( layoutInfo ) {
               scope.layoutClass = layoutInfo.className;
               element.html( layoutInfo.htmlContent );
               $compile( element.contents() )( scope );

               var defaultAreaHtml = defaultAreas.reduce( function( html, area ) {
                  if( !controller.areas.exists( area.name ) ) {
                     return html + '<div data-ax-widget-area="' + area.name + '"' +
                            ( area.hidden ? ' style="display: none;"' : '' ) + '></div>';
                  }
                  return html;
               }, '' );

               if( defaultAreaHtml ) {
                  element.append( $compile( defaultAreaHtml )( scope ) );
               }
            } );

         }
      };

   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/profiling/output',[
   'angular'
], function( ng ) {
   'use strict';

   var win;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function logForId( axProfiling, wlKey, id ) {
      var profilingData = axProfiling.items;
      var isScopeId = !!id.match( /^[A-Za-z0-9]{3}$/ ) && id in profilingData;
      var scopeId = id;
      var watchers = [];

      if( isScopeId ) {
         watchers = profilingData[ id ].watchers;
      }
      else {
         scopeId = axProfiling.widgetIdToScopeId[ id ];
         watchers =
            flatMap( Object.keys( profilingData )
               .map( function( id ) {
                  return profilingData[ id ];
               } )
               .filter( function( item ) {
                  return item.context.widgetId === id;
               } ),
               function( item ) {
                  return item.watchers;
               }
            );
      }

      var ngContext = [].slice.call( win.document.getElementsByClassName( 'ng-scope' ), 0 )
         .concat( [ win.document ] )
         .map( function( element ) {
            return {
               element: element,
               scope: ng.element( element ).scope()
            };
         } )
         .filter( function( item ) {
            return item.scope.$id === scopeId;
         } )[ 0 ] || null;

      consoleLog( 'Showing details for %s with id "%s"', isScopeId ? 'scope' : 'widget', id );

      if( ngContext ) {
         consoleLog( 'Context: Scope: %o, Element %o', ngContext.scope, ngContext.element );
      }

      var data = watchers.map( function( entry ) {
         var result = {};

         if( !wlKey || wlKey === 'watchFn' ) {
            var w = entry.watchFn;
            result[ 'Watcher' ] = w.name;
            result[ 'Watcher ms total' ] = toPrecision( w.time, 3 );
            result[ 'Watcher ms average' ] = toPrecision( average( w.time, w.count ), 3 );
            result[ 'Watcher # executions' ] = w.count;
         }

         if( !wlKey || wlKey === 'listener' ) {
            var l = entry.listener;
            result[ 'Listener' ] = l.name;
            result[ 'Listener ms total' ] = toPrecision( l.time, 3 );
            result[ 'Listener ms average' ] = toPrecision( average( l.time, l.count ), 3 );
            result[ 'Listener # executions' ] = l.count;
         }

         return result;
      } );
      logTabularData( data );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function logAll( axProfiling, wlKey ) {
      var profilingData = axProfiling.items;
      var data = [];
      var totalWatchFunctions = 0;
      var totalWatchExpressions = 0;
      var totalTime = 0;
      var totalExecutions = 0;

      var dataByWidgetId = {};
      ng.forEach( profilingData, function( item, key ) {
         var widgetId = item.context.widgetId;
         if( !widgetId ) {
            dataByWidgetId[ key ] = item;
            return;
         }

         if( !( widgetId in dataByWidgetId ) ) {
            dataByWidgetId[ widgetId ] = {
               context: item.context,
               watchers: []
            };
         }

         [].push.apply( dataByWidgetId[ widgetId ].watchers, item.watchers );
      } );

      ng.forEach( dataByWidgetId, function( item ) {
         var time = 0;
         var executions = 0;
         var noOfFunctions = 0;
         var noOfStrings = 0;

         item.watchers.forEach( function( entry ) {
            time += entry[ wlKey ].time;
            executions += entry[ wlKey ].count;
            noOfFunctions += entry[ wlKey ].type === 'f' ? 1 : 0;
            noOfStrings += entry[ wlKey ].type === 's' ? 1 : 0;
         }, 0 );

         data.push( {
            'Widget name': item.context.widgetName || '?',
            'Widget id': item.context.widgetId || '?',
            'Scope id': item.context.widgetScopeId || item.context.scopeId,
            '# functions': noOfFunctions,
            '# strings': noOfStrings,
            '# total:': noOfFunctions + noOfStrings,
            'ms total': toPrecision( time, 3 ),
            'ms average': toPrecision( average( time, executions ), 3 ),
            '# of executions': executions
         } );

         totalWatchFunctions += noOfFunctions;
         totalWatchExpressions += noOfStrings;
         totalTime += time;
         totalExecutions += executions;
      } );

      data.push( {
         'Widget name': '',
         'Widget id': '',
         'Scope id': 'Total:',
         '# functions': totalWatchFunctions,
         '# strings': totalWatchExpressions,
         '# total:': totalWatchFunctions + totalWatchExpressions,
         'ms total': toPrecision( totalTime, 3 ),
         'ms average': toPrecision( average( totalTime, totalExecutions ), 3 ),
         '# of executions': totalExecutions
      } );

      logTabularData( data );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function average( time, count ) {
      return count > 0 ? time / count : 0;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function toPrecision( number, precision ) {
      var factor = precision === 0 ? 1 : Math.pow( 10, precision );
      return Math.round( number * factor ) / factor;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function flatMap( arr, func ) {
      return Array.prototype.concat.apply( [], arr.map( func ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function consoleLog( msg, arg /*, ... */ ) {
      if( !win.console || !win.console.log ) {
         return;
      }

      // MSIE8 does not support console.log.apply( ... )
      // The following call is equivalent to: console.log.apply( console, args );
      Function.apply.apply( win.console.log, [ win.console, arguments ] );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function logTabularData( data ) {
      if( win.console.table ) {
         win.console.table( data );
      }
      else {
         consoleLog( JSON.stringify( data, null, 2 ) );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      create: function( windowObject ) {
         win = windowObject;

         return {
            log: consoleLog,
            logForId: logForId,
            logAll: logAll
         };
      }
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/profiling/profiling',[
   'angular',
   './output'
], function( ng, output ) {
   'use strict';

   var module = ng.module( 'axProfiling', [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var config;
   var axProfiling;
   var origWatch;
   var win;
   var out;

   module.run( [ '$rootScope', '$window', 'axConfiguration', function( $rootScope, $window, configuration ) {
      win = $window;
      config = configuration.get( 'profiling', { enabled: false } );
      out = output.create( $window );

      if( config.enabled !== true ) {
         return;
      }

      if( !win.performance || !win.performance.now ) {
         out.log( 'Performance api is not available. Profiling is disabled.' );
         return;
      }

      out.log( '%c!!! Profiling enabled. Application performance will suffer !!!',
                  'font-weight: bold; font-size: 1.2em' );
      out.log( 'Type "axProfiling.help()" to get a list of available methods' );

      var scopePrototype = $rootScope.constructor.prototype;

      axProfiling = $window.axProfiling = {
         items: {},
         widgetIdToScopeId: {},
         logWatchers: function( id ) {
            if( id && typeof id === 'string' ) {
               out.logForId( axProfiling, 'watchFn', id );
            }
            else {
               out.logAll( axProfiling, 'watchFn' );
            }
         },
         logListeners:  function( id ) {
            if( id && typeof id === 'string' ) {
               out.logForId( axProfiling, 'listener', id );
            }
            else {
               out.logAll( axProfiling, 'listener' );
            }
         },
         log:  function( id ) {
            if( id && typeof id === 'string' ) {
               out.logForId( axProfiling, null, id );
            }
            else {
               out.log( 'All listeners:' );
               out.logAll( axProfiling, 'listener' );
               out.log( 'All watchers:' );
               out.logAll( axProfiling, 'watchFn' );
            }
         },
         reset: function() {
            Object.keys( axProfiling.items )
               .forEach( function( key ) {
                  axProfiling.items[ key ].watchers
                     .forEach( function( watcher ) {
                        watcher.watchFn.time = 0;
                        watcher.watchFn.count = 0;
                        watcher.listener.time = 0;
                        watcher.listener.count = 0;
                     } );
               } );
         },
         help: printHelp
      };

      origWatch = scopePrototype.$watch;
      scopePrototype.$watch = function( watchExp, listener, objectEquality ) {
         return attachProfiling( this, watchExp, listener, objectEquality || false );
      };
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function attachProfiling( scope, watchExp, listener, objectEquality ) {
      var watcherIsFunction = typeof watchExp === 'function';
      var listenerIsFunction = typeof listener === 'function';

      var items = axProfiling.items;
      var context = determineContext( scope );
      if( !( scope.$id in items ) ) {
         items[ scope.$id ] = {
            context: context,
            watchers: []
         };

         scope.$on( '$destroy', function() {
            detachProfiling( scope );
            delete items[ scope.$id ];
         } );
      }


      if( context.widgetScopeId ) {
         if( !( context.widgetId in axProfiling.widgetIdToScopeId ) ) {
            axProfiling.widgetIdToScopeId[ context.widgetId ] = context.widgetScopeId;
         }
      }

      var profilingEntry = {
         watchFn: {
            type: watcherIsFunction ? 'f' : 's',
            name: watcherIsFunction ? functionName( watchExp ) + '()' : watchExp,
            time: 0,
            count: 0
         },
         listener: {
            type: listenerIsFunction ? 'f' : 's',
            name: listenerIsFunction ? functionName( listener ) + '()' : listener,
            time: 0,
            count: 0
         }
      };
      items[ scope.$id ].watchers.push( profilingEntry );

      var stopWatching = origWatch.call( scope, watchExp, listener, objectEquality );

      var watchEntry = scope.$$watchers[0];
      watchEntry.get = instrumentFunction( watchEntry.get, profilingEntry.watchFn );
      watchEntry.fn = instrumentFunction( watchEntry.fn, profilingEntry.listener );

      return function() {
         stopWatching();
         detachProfiling( scope );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function detachProfiling( scope ) {
      delete axProfiling.items[ scope.$id ];
      Object.keys( axProfiling.widgetIdToScopeId ).forEach( function( widgetId ) {
         if( axProfiling.widgetIdToScopeId[ widgetId ] === scope.$id ) {
            delete axProfiling.widgetIdToScopeId[ widgetId ];
         }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function instrumentFunction( func, entry ) {
      return function() {
         var start = win.performance.now();
         var result = func.apply( null, arguments );
         var time = win.performance.now() - start;

         ++entry.count;
         entry.time += time;

         return result;
      };
   }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function determineContext( scope ) {
      var current = scope;
      while( !current.hasOwnProperty( 'widget' ) && current !== current.$root ) {
         current = current.$parent;
      }

      var isInWidget = !!current.widget;

      return {
         widgetName: isInWidget ? current.widget.path : '',
         widgetId: isInWidget ? current.widget.id : '',
         widgetScopeId: isInWidget ? current.$id : null,
         scopeId: scope.$id
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var FUNCTION_NAME_REGEXP = /^[ ]*function([^\(]*?)\(/;
   function functionName( func ) {
      if( func.name && typeof func.name === 'string' ) {
         return func.name;
      }

      var match = FUNCTION_NAME_REGEXP.exec( func.toString() );
      if( match ) {
         return match[1].trim();
      }

      return '[anonymous]';
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function printHelp() {
      out.log(
         'Available commands:\n\n' +
         ' - help():\n' +
         '     prints this help\n\n' +
         ' - log( [scopeOrWidgetId] ):\n' +
         '     If the argument is omitted this is the same as calling\n' +
         '     logWatchers() first and logListeners() afterwards.\n' +
         '     Otherwise all listeners and watchers of the widget or scope\n' +
         '     with the given id are logged in one table\n\n' +
         ' - logWatchers( [scopeOrWidgetId] ):\n' +
         '     If the argument is omitted the watchers of all scopes belonging to\n' +
         '     a specific widget or of global scopes are logged.\n' +
         '     Otherwise more detailed data for the watchers of the given scope\n' +
         '     or widget are logged.\n\n' +
         ' - logListeners( [scopeOrWidgetId] ):\n' +
         '     If the argument is omitted the listeners of all scopes belonging to\n' +
         '     a specific widget or of global scopes are logged.\n' +
         '     Otherwise more detailed data for the listeners of the given scope\n' +
         '     or widget are logged.\n\n'+
         ' - reset():\n' +
         '     Resets all "# of executions" and millisecond data to zero.'
      );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/runtime/runtime_dependencies',[
   'angular',
   'angular-sanitize',
   './runtime_services',
   './flow',
   './page',
   '../directives/directives',
   '../profiling/profiling'
], function( ng, ngSanitizeModule, runtimeServicesModule, flowModule, pageModule, directives, profilingModule ) {
   'use strict';

   return ng.module( 'axRuntimeDependencies', [
      'ngSanitize',

      runtimeServicesModule.name,
      flowModule.name,
      pageModule.name,
      directives.id.name,
      directives.widgetArea.name,
      profilingModule.name
   ] );

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/laxar',[
   'angular',
   './lib/logging/log',
   './lib/directives/directives',
   './lib/i18n/i18n',
   './lib/utilities/assert',
   './lib/utilities/configuration',
   './lib/utilities/fn',
   './lib/utilities/object',
   './lib/utilities/storage',
   './lib/utilities/string',
   './lib/runtime/runtime',
   './lib/runtime/runtime_dependencies',
   './lib/widget_adapters/adapters'
], function(
   ng,
   log,
   directives,
   i18n,
   assert,
   configuration,
   fn,
   object,
   storage,
   string,
   runtime,
   runtimeDependencies,
   adapters
) {
   'use strict';

   /**
    * Bootstraps AngularJS on the current `window.document` and sets up the LaxarJS runtime. All AngularJS
    * module names of widgets that are passed to this method will be passed to `angular.bootstrap` as initial
    * dependencies, along with internal laxar modules. This is needed because AngularJS currently doesn't
    * support lazy loading of modules. The `portal_angular_dependencies` grunt task of LaxarJS will collect
    * all widgets reachable for the given `flow.json`, define them as dependencies of an amd module, that will
    * return the names of their respective AngularJS modules. This list of module names can simply be passed
    * to the `boostrap` method.
    *
    * @memberOf laxar
    *
    * @param {String[]} widgetModules
    *    all AngularJS modules that should instantly be loaded (most probably the widgets)
    * @param {{create: Function}[]} optionalWidgetAdapters
    *    an optional array of user-defined widget adapter modules
    */
   function bootstrap( widgetModules, optionalWidgetAdapters ) {

      setInstanceIdLogTag();

      findAndLogDeprecatedSettings();

      log.trace( 'Bootstrapping LaxarJS...' );

      if( optionalWidgetAdapters && Array.isArray( optionalWidgetAdapters ) ) {
         adapters.addAdapters( optionalWidgetAdapters );
      }
      var dependencies = [ runtime.name, runtimeDependencies.name ];

      Object.keys( widgetModules ).forEach( function( technology ) {
         var adapter = adapters.getFor( technology );
         if( !adapter ) {
            log.error( 'Unknown widget technology: [0]', technology );
            return;
         }

         var module = adapter.bootstrap( widgetModules[ technology ] );
         if( module && module.name ) {
            dependencies.push( module.name );
         }
      } );

      ng.element( document ).ready( function bootstrap() {
         ng.bootstrap( document, dependencies );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function findAndLogDeprecatedSettings() {
      var deprecatedConfiguration = {
         'event_bus.timeout_ms': 'eventBusTimeoutMs',
         'file_resource_provider.listings': 'fileListings',
         'file_resource_provider.fileListings': 'fileListings',
         'file_resource_provider.useEmbedded': 'useEmbeddedFileListings',
         'portal.useMergedCss': 'useMergedCss',
         'portal.theme': 'theme',
         'portal.flow.entryPoint': 'flow.entryPoint',
         'portal.flow.exitPoints': 'flow.exitPoints'
      };

      // Obtain global object in strict mode: http://stackoverflow.com/questions/3277182/
      /*jshint evil:true*/
      var global = new Function( 'return this' )();
      ng.forEach( deprecatedConfiguration, function( newLocation, oldLocation ) {
         var oldValue = object.path( global.laxar, oldLocation );
         if( oldValue !== undefined ) {
            log.warn( 'Found deprecated configuration key "[0]". Use "[1]" instead.', oldLocation, newLocation );
            var newValue = object.path( global.laxar, newLocation );
            if( newValue === undefined ) {
               object.setPath( global.laxar, newLocation, oldValue );
            }
         }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function setInstanceIdLogTag() {
      var instanceIdStorageKey = 'axLogTags.INST';
      var store = storage.getApplicationSessionStorage();
      var instanceId = store.getItem( instanceIdStorageKey );
      if( !instanceId ) {
         instanceId = '' + new Date().getTime() + Math.floor( Math.random() * 100 );
         store.setItem( instanceIdStorageKey, instanceId );
      }

      log.addTag( 'INST', instanceId );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      assert: assert,
      bootstrap: bootstrap,
      configuration: configuration,
      directives: directives,
      fn: fn,
      i18n: i18n,
      log: log,
      object: object,
      storage: storage,
      string: string
   };

} );

define('laxar', ['laxar/laxar'], function (main) { return main; });

