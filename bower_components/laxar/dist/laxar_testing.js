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
         tags: configuration.get( 'i18n.locales' )
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

/* jshint proto: true */

/**
 * jjv.js -- A javascript library to validate json input through a json-schema.
 *
 * Copyright (c) 2013 Alex Cornejo.
 *
 * Redistributable under a MIT-style open source license.
 */

(function () {
  var clone = function (obj) {
      // Handle the 3 simple types (string, number, function), and null or undefined
      if (obj === null || typeof obj !== 'object') return obj;
      var copy;

      // Handle Date
      if (obj instanceof Date) {
          copy = new Date();
          copy.setTime(obj.getTime());
          return copy;
      }

      // handle RegExp
      if (obj instanceof RegExp) {
        copy = new RegExp(obj);
        return copy;
      }

      // Handle Array
      if (obj instanceof Array) {
          copy = [];
          for (var i = 0, len = obj.length; i < len; i++)
              copy[i] = clone(obj[i]);
          return copy;
      }

      // Handle Object
      if (obj instanceof Object) {
          copy = {};
//           copy = Object.create(Object.getPrototypeOf(obj));
          for (var attr in obj) {
              if (obj.hasOwnProperty(attr))
                copy[attr] = clone(obj[attr]);
          }
          return copy;
      }

      throw new Error("Unable to clone object!");
  };

  var clone_stack = function (stack) {
    var new_stack = [ clone(stack[0]) ], key = new_stack[0].key, obj = new_stack[0].object;
    for (var i = 1, len = stack.length; i< len; i++) {
      obj = obj[key];
      key = stack[i].key;
      new_stack.push({ object: obj, key: key });
    }
    return new_stack;
  };

  var copy_stack = function (new_stack, old_stack) {
    var stack_last = new_stack.length-1, key = new_stack[stack_last].key;
    old_stack[stack_last].object[key] = new_stack[stack_last].object[key];
  };

  var handled = {
    'type': true,
    'not': true,
    'anyOf': true,
    'allOf': true,
    'oneOf': true,
    '$ref': true,
    '$schema': true,
    'id': true,
    'exclusiveMaximum': true,
    'exclusiveMininum': true,
    'properties': true,
    'patternProperties': true,
    'additionalProperties': true,
    'items': true,
    'additionalItems': true,
    'required': true,
    'default': true,
    'title': true,
    'description': true,
    'definitions': true,
    'dependencies': true
  };

  var fieldType = {
    'null': function (x) {
      return x === null;
    },
    'string': function (x) {
      return typeof x === 'string';
    },
    'boolean': function (x) {
      return typeof x === 'boolean';
    },
    'number': function (x) {
      // Use x === x instead of !isNaN(x) for speed
      return typeof x === 'number' && x === x;
    },
    'integer': function (x) {
      return typeof x === 'number' && x%1 === 0;
    },
    'object': function (x) {
      return x && typeof x === 'object' && !Array.isArray(x);
    },
    'array': function (x) {
      return Array.isArray(x);
    },
    'date': function (x) {
      return x instanceof Date;
    }
  };

  // missing: uri, date-time, ipv4, ipv6
  var fieldFormat = {
    'alpha': function (v) {
      return (/^[a-zA-Z]+$/).test(v);
    },
    'alphanumeric': function (v) {
      return (/^[a-zA-Z0-9]+$/).test(v);
    },
    'identifier': function (v) {
      return (/^[-_a-zA-Z0-9]+$/).test(v);
    },
    'hexadecimal': function (v) {
      return (/^[a-fA-F0-9]+$/).test(v);
    },
    'numeric': function (v) {
      return (/^[0-9]+$/).test(v);
    },
    'date-time': function (v) {
      return !isNaN(Date.parse(v)) && v.indexOf('/') === -1;
    },
    'uppercase': function (v) {
      return v === v.toUpperCase();
    },
    'lowercase': function (v) {
      return v === v.toLowerCase();
    },
    'hostname': function (v) {
      return v.length < 256 && (/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*$/).test(v);
    },
    'uri': function (v) {
      return (/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/).test(v);
    },
    'email': function (v) { // email, ipv4 and ipv6 adapted from node-validator
      return (/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/).test(v);
    },
    'ipv4': function (v) {
      if ((/^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/).test(v)) {
        var parts = v.split('.').sort();
        if (parts[3] <= 255)
          return true;
      }
      return false;
    },
    'ipv6': function(v) {
      return (/^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/).test(v);
     /*  return (/^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/).test(v); */
    }
  };

  var fieldValidate = {
    'readOnly': function (v, p) {
      return false;
    },
    // ****** numeric validation ********
    'minimum': function (v, p, schema) {
      return !(v < p || schema.exclusiveMinimum && v <= p);
    },
    'maximum': function (v, p, schema) {
      return !(v > p || schema.exclusiveMaximum && v >= p);
    },
    'multipleOf': function (v, p) {
      return (v/p)%1 === 0 || typeof v !== 'number';
    },
    // ****** string validation ******
    'pattern': function (v, p) {
      if (typeof v !== 'string')
        return true;
      var pattern, modifiers;
      if (typeof p === 'string')
        pattern=p;
      else {
        pattern=p[0];
        modifiers=p[1];
      }
      var regex = new RegExp(pattern, modifiers);
      return regex.test(v);
    },
    'minLength': function (v, p) {
      return v.length >= p || typeof v !== 'string';
    },
    'maxLength': function (v, p) {
      return v.length <= p || typeof v !== 'string';
    },
    // ***** array validation *****
    'minItems': function (v, p) {
      return v.length >= p || !Array.isArray(v);
    },
    'maxItems': function (v, p) {
      return v.length <= p || !Array.isArray(v);
    },
    'uniqueItems': function (v, p) {
      var hash = {}, key;
      for (var i = 0, len = v.length; i < len; i++) {
        key = JSON.stringify(v[i]);
        if (hash.hasOwnProperty(key))
          return false;
        else
          hash[key] = true;
      }
      return true;
    },
    // ***** object validation ****
    'minProperties': function (v, p) {
      if (typeof v !== 'object')
        return true;
      var count = 0;
      for (var attr in v) if (v.hasOwnProperty(attr)) count = count + 1;
      return count >= p;
    },
    'maxProperties': function (v, p) {
      if (typeof v !== 'object')
        return true;
      var count = 0;
      for (var attr in v) if (v.hasOwnProperty(attr)) count = count + 1;
      return count <= p;
    },
    // ****** all *****
    'constant': function (v, p) {
      return JSON.stringify(v) == JSON.stringify(p);
    },
    'enum': function (v, p) {
      var i, len, vs;
      if (typeof v === 'object') {
        vs = JSON.stringify(v);
        for (i = 0, len = p.length; i < len; i++)
          if (vs === JSON.stringify(p[i]))
            return true;
      } else {
        for (i = 0, len = p.length; i < len; i++)
          if (v === p[i])
            return true;
      }
      return false;
    }
  };

  var normalizeID = function (id) {
    return id.indexOf("://") === -1 ? id : id.split("#")[0];
  };

  var resolveURI = function (env, schema_stack, uri) {
    var curschema, components, hash_idx, name;

    hash_idx = uri.indexOf('#');

    if (hash_idx === -1) {
      if (!env.schema.hasOwnProperty(uri))
        return null;
      return [env.schema[uri]];
    }

    if (hash_idx > 0) {
      name = uri.substr(0, hash_idx);
      uri = uri.substr(hash_idx+1);
      if (!env.schema.hasOwnProperty(name)) {
        if (schema_stack && schema_stack[0].id === name)
          schema_stack = [schema_stack[0]];
        else
          return null;
      } else
        schema_stack = [env.schema[name]];
    } else {
      if (!schema_stack)
        return null;
      uri = uri.substr(1);
    }

    if (uri === '')
      return [schema_stack[0]];

    if (uri.charAt(0) === '/') {
      uri = uri.substr(1);
      curschema = schema_stack[0];
      components = uri.split('/');
      while (components.length > 0) {
        if (!curschema.hasOwnProperty(components[0]))
          return null;
        curschema = curschema[components[0]];
        schema_stack.push(curschema);
        components.shift();
      }
      return schema_stack;
    } else // FIX: should look for subschemas whose id matches uri
      return null;
  };

  var resolveObjectRef = function (object_stack, uri) {
    var components, object, last_frame = object_stack.length-1, skip_frames, frame, m = /^(\d+)/.exec(uri);

    if (m) {
      uri = uri.substr(m[0].length);
      skip_frames = parseInt(m[1], 10);
      if (skip_frames < 0 || skip_frames > last_frame)
        return;
      frame = object_stack[last_frame-skip_frames];
      if (uri === '#')
        return frame.key;
    } else
      frame = object_stack[0];

    object = frame.object[frame.key];

    if (uri === '')
      return object;

    if (uri.charAt(0) === '/') {
      uri = uri.substr(1);
      components = uri.split('/');
      while (components.length > 0) {
        components[0] = components[0].replace(/~1/g, '/').replace(/~0/g, '~');
        if (!object.hasOwnProperty(components[0]))
          return;
        object = object[components[0]];
        components.shift();
      }
      return object;
    } else
      return;
  };

  var checkValidity = function (env, schema_stack, object_stack, options) {
    var i, len, count, hasProp, hasPattern;
    var p, v, malformed = false, objerrs = {}, objerr, props, matched;
    var sl = schema_stack.length-1, schema = schema_stack[sl], new_stack;
    var ol = object_stack.length-1, object = object_stack[ol].object, name = object_stack[ol].key, prop = object[name];
    var errCount, minErrCount;

    if (schema.hasOwnProperty('$ref')) {
      schema_stack= resolveURI(env, schema_stack, schema.$ref);
      if (!schema_stack)
        return {'$ref': schema.$ref};
      else
        return checkValidity(env, schema_stack, object_stack, options);
    }

    if (schema.hasOwnProperty('type')) {
      if (typeof schema.type === 'string') {
        if (options.useCoerce && env.coerceType.hasOwnProperty(schema.type))
          prop = object[name] = env.coerceType[schema.type](prop);
        if (!env.fieldType[schema.type](prop))
          return {'type': schema.type};
      } else {
        malformed = true;
        for (i = 0, len = schema.type.length; i < len && malformed; i++)
          if (env.fieldType[schema.type[i]](prop))
            malformed = false;
        if (malformed)
          return {'type': schema.type};
      }
    }

    if (schema.hasOwnProperty('allOf')) {
      for (i = 0, len = schema.allOf.length; i < len; i++) {
        objerr = checkValidity(env, schema_stack.concat(schema.allOf[i]), object_stack, options);
        if (objerr)
          return objerr;
      }
    }

    if (!options.useCoerce && !options.useDefault && !options.removeAdditional) {
      if (schema.hasOwnProperty('oneOf')) {
        minErrCount = Infinity;
        for (i = 0, len = schema.oneOf.length, count = 0; i < len; i++) {
          objerr = checkValidity(env, schema_stack.concat(schema.oneOf[i]), object_stack, options);
          if (!objerr) {
            count = count + 1;
            if (count > 1)
              break;
          } else {
            errCount = objerr.schema ? Object.keys(objerr.schema).length : 1;
            if (errCount < minErrCount) {
                minErrCount = errCount;
                objerrs = objerr;
            }
          }
        }
        if (count > 1)
          return {'oneOf': true};
        else if (count < 1)
          return objerrs;
        objerrs = {};
      }

      if (schema.hasOwnProperty('anyOf')) {
        objerrs = null;
        minErrCount = Infinity;
        for (i = 0, len = schema.anyOf.length; i < len; i++) {
          objerr = checkValidity(env, schema_stack.concat(schema.anyOf[i]), object_stack, options);
          if (!objerr) {
            objerrs = null;
            break;
          }
          else {
            errCount = objerr.schema ? Object.keys(objerr.schema).length : 1;
            if (errCount < minErrCount) {
                minErrCount = errCount;
                objerrs = objerr;
            }
          }
        }
        if (objerrs)
          return objerrs;
      }

      if (schema.hasOwnProperty('not')) {
        objerr = checkValidity(env, schema_stack.concat(schema.not), object_stack, options);
        if (!objerr)
          return {'not': true};
      }
    } else {
      if (schema.hasOwnProperty('oneOf')) {
        minErrCount = Infinity;
        for (i = 0, len = schema.oneOf.length, count = 0; i < len; i++) {
          new_stack = clone_stack(object_stack);
          objerr = checkValidity(env, schema_stack.concat(schema.oneOf[i]), new_stack, options);
          if (!objerr) {
            count = count + 1;
            if (count > 1)
              break;
            else
              copy_stack(new_stack, object_stack);
          } else {
            errCount = objerr.schema ? Object.keys(objerr.schema).length : 1;
            if (errCount < minErrCount) {
                minErrCount = errCount;
                objerrs = objerr;
            }
          }
        }
        if (count > 1)
          return {'oneOf': true};
        else if (count < 1)
          return objerrs;
        objerrs = {};
      }

      if (schema.hasOwnProperty('anyOf')) {
        objerrs = null;
        minErrCount = Infinity;
        for (i = 0, len = schema.anyOf.length; i < len; i++) {
          new_stack = clone_stack(object_stack);
          objerr = checkValidity(env, schema_stack.concat(schema.anyOf[i]), new_stack, options);
          if (!objerr) {
            copy_stack(new_stack, object_stack);
            objerrs = null;
            break;
          }
          else {
            errCount = objerr.schema ? Object.keys(objerr.schema).length : 1;
            if (errCount < minErrCount) {
                minErrCount = errCount;
                objerrs = objerr;
            }
          }
        }
        if (objerrs)
          return objerrs;
      }

      if (schema.hasOwnProperty('not')) {
        new_stack = clone_stack(object_stack);
        objerr = checkValidity(env, schema_stack.concat(schema.not), new_stack, options);
        if (!objerr)
          return {'not': true};
      }
    }

    if (schema.hasOwnProperty('dependencies')) {
      for (p in schema.dependencies)
        if (schema.dependencies.hasOwnProperty(p) && prop.hasOwnProperty(p)) {
          if (Array.isArray(schema.dependencies[p])) {
            for (i = 0, len = schema.dependencies[p].length; i < len; i++)
              if (!prop.hasOwnProperty(schema.dependencies[p][i])) {
                return {'dependencies': true};
              }
          } else {
            objerr = checkValidity(env, schema_stack.concat(schema.dependencies[p]), object_stack, options);
            if (objerr)
              return objerr;
          }
        }
    }

    if (!Array.isArray(prop)) {
      props = [];
      objerrs = {};
      for (p in prop)
        if (prop.hasOwnProperty(p))
          props.push(p);

      if (options.checkRequired && schema.required) {
        for (i = 0, len = schema.required.length; i < len; i++)
          if (!prop.hasOwnProperty(schema.required[i])) {
            objerrs[schema.required[i]] = {'required': true};
            malformed = true;
          }
      }

      hasProp = schema.hasOwnProperty('properties');
      hasPattern = schema.hasOwnProperty('patternProperties');
      if (hasProp || hasPattern) {
        i = props.length;
        while (i--) {
          matched = false;
          if (hasProp && schema.properties.hasOwnProperty(props[i])) {
            matched = true;
            objerr = checkValidity(env, schema_stack.concat(schema.properties[props[i]]), object_stack.concat({object: prop, key: props[i]}), options);
            if (objerr !== null) {
              objerrs[props[i]] = objerr;
              malformed = true;
            }
          }
          if (hasPattern) {
            for (p in schema.patternProperties)
              if (schema.patternProperties.hasOwnProperty(p) && props[i].match(p)) {
                matched = true;
                objerr = checkValidity(env, schema_stack.concat(schema.patternProperties[p]), object_stack.concat({object: prop, key: props[i]}), options);
                if (objerr !== null) {
                  objerrs[props[i]] = objerr;
                  malformed = true;
                }
              }
          }
          if (matched)
            props.splice(i, 1);
        }
      }

      if (options.useDefault && hasProp && !malformed) {
        for (p in schema.properties)
          if (schema.properties.hasOwnProperty(p) && !prop.hasOwnProperty(p) && schema.properties[p].hasOwnProperty('default'))
            prop[p] = schema.properties[p]['default'];
      }

      if (options.removeAdditional && hasProp && schema.additionalProperties !== true && typeof schema.additionalProperties !== 'object') {
        for (i = 0, len = props.length; i < len; i++)
          delete prop[props[i]];
      } else {
        if (schema.hasOwnProperty('additionalProperties')) {
          if (typeof schema.additionalProperties === 'boolean') {
            if (!schema.additionalProperties) {
              for (i = 0, len = props.length; i < len; i++) {
                objerrs[props[i]] = {'additional': true};
                malformed = true;
              }
            }
          } else {
            for (i = 0, len = props.length; i < len; i++) {
              objerr = checkValidity(env, schema_stack.concat(schema.additionalProperties), object_stack.concat({object: prop, key: props[i]}), options);
              if (objerr !== null) {
                objerrs[props[i]] = objerr;
                malformed = true;
              }
            }
          }
        }
      }
      if (malformed)
        return {'schema': objerrs};
    } else {
      if (schema.hasOwnProperty('items')) {
        if (Array.isArray(schema.items)) {
          for (i = 0, len = schema.items.length; i < len; i++) {
            objerr = checkValidity(env, schema_stack.concat(schema.items[i]), object_stack.concat({object: prop, key: i}), options);
            if (objerr !== null) {
              objerrs[i] = objerr;
              malformed = true;
            }
          }
          if (prop.length > len && schema.hasOwnProperty('additionalItems')) {
            if (typeof schema.additionalItems === 'boolean') {
              if (!schema.additionalItems)
                return {'additionalItems': true};
            } else {
              for (i = len, len = prop.length; i < len; i++) {
                objerr = checkValidity(env, schema_stack.concat(schema.additionalItems), object_stack.concat({object: prop, key: i}), options);
                if (objerr !== null) {
                  objerrs[i] = objerr;
                  malformed = true;
                }
              }
            }
          }
        } else {
          for (i = 0, len = prop.length; i < len; i++) {
            objerr = checkValidity(env, schema_stack.concat(schema.items), object_stack.concat({object: prop, key: i}), options);
            if (objerr !== null) {
              objerrs[i] = objerr;
              malformed = true;
            }
          }
        }
      } else if (schema.hasOwnProperty('additionalItems')) {
        if (typeof schema.additionalItems !== 'boolean') {
          for (i = 0, len = prop.length; i < len; i++) {
            objerr = checkValidity(env, schema_stack.concat(schema.additionalItems), object_stack.concat({object: prop, key: i}), options);
            if (objerr !== null) {
              objerrs[i] = objerr;
              malformed = true;
            }
          }
        }
      }
      if (malformed)
        return {'schema': objerrs};
    }

    for (v in schema) {
      if (schema.hasOwnProperty(v) && !handled.hasOwnProperty(v)) {
        if (v === 'format') {
          if (env.fieldFormat.hasOwnProperty(schema[v]) && !env.fieldFormat[schema[v]](prop, schema, object_stack, options)) {
            objerrs[v] = true;
            malformed = true;
          }
        } else {
          if (env.fieldValidate.hasOwnProperty(v) && !env.fieldValidate[v](prop, schema[v].hasOwnProperty('$data') ? resolveObjectRef(object_stack, schema[v].$data) : schema[v], schema, object_stack, options)) {
            objerrs[v] = true;
            malformed = true;
          }
        }
      }
    }

    if (malformed)
      return objerrs;
    else
      return null;
  };

  var defaultOptions = {
    useDefault: false,
    useCoerce: false,
    checkRequired: true,
    removeAdditional: false
  };

  function Environment() {
    if (!(this instanceof Environment))
      return new Environment();

    this.coerceType = {};
    this.fieldType = clone(fieldType);
    this.fieldValidate = clone(fieldValidate);
    this.fieldFormat = clone(fieldFormat);
    this.defaultOptions = clone(defaultOptions);
    this.schema = {};
  }

  Environment.prototype = {
    validate: function (name, object, options) {
      var schema_stack = [name], errors = null, object_stack = [{object: {'__root__': object}, key: '__root__'}];

      if (typeof name === 'string') {
        schema_stack = resolveURI(this, null, name);
        if (!schema_stack)
          throw new Error('jjv: could not find schema \'' + name + '\'.');
      }

      if (!options) {
        options = this.defaultOptions;
      } else {
        for (var p in this.defaultOptions)
          if (this.defaultOptions.hasOwnProperty(p) && !options.hasOwnProperty(p))
            options[p] = this.defaultOptions[p];
      }

      errors = checkValidity(this, schema_stack, object_stack, options);

      if (errors)
        return {validation: errors.hasOwnProperty('schema') ? errors.schema : errors};
      else
        return null;
    },

    resolveRef: function (schema_stack, $ref) {
      return resolveURI(this, schema_stack, $ref);
    },

    addType: function (name, func) {
      this.fieldType[name] = func;
    },

    addTypeCoercion: function (type, func) {
      this.coerceType[type] = func;
    },

    addCheck: function (name, func) {
      this.fieldValidate[name] = func;
    },

    addFormat: function (name, func) {
      this.fieldFormat[name] = func;
    },

    addSchema: function (name, schema) {
      if (!schema && name) {
        schema = name;
        name = undefined;
      }
      if (schema.hasOwnProperty('id') && typeof schema.id === 'string' && schema.id !== name) {
        if (schema.id.charAt(0) === '/')
          throw new Error('jjv: schema id\'s starting with / are invalid.');
        this.schema[normalizeID(schema.id)] = schema;
      } else if (!name) {
        throw new Error('jjv: schema needs either a name or id attribute.');
      }
      if (name)
        this.schema[normalizeID(name)] = schema;
    }
  };

  // Export for use in server and client.
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Environment;
  else if (typeof define === 'function' && define.amd)
    define('jjv',[],function () {return Environment;});
  else
    this.jjv = Environment;
}).call(this);

(function() {
  'use strict';

  function make(o) {
    var errors = [];

    var keys = Object.keys(o.validation);

    // when we're on a leaf node we need to handle the validation errors,
    // otherwise we continue walking
    var leaf = keys.every(function(key) {
      return typeof o.validation[key] !== 'object' ||
        isArray(o.validation[key]);
    });

    if (leaf) {
      // step through each validation issue
      // example: { required: true }
      keys.forEach(function(key) {
        var error, properties;
        try {
          switch (key) {
            case 'type':
              var type = typeof o.data;

              // further discover types
              if (type === 'number' && ('' + o.data).match(/^\d+$/)) {
                type = 'integer';
              } else if (type === 'object' && Array.isArray(o.data)) {
                type = 'array';
              }

              // the value of type is the required type (ex: { type: 'string' })
              error = {
                code: 'INVALID_TYPE',
                message: 'Invalid type: ' + type + ' should be ' +
                         (isArray(o.validation[key]) ?  'one of ' :  '') +
                          o.validation[key]
              };

              break;
            case 'required':
              properties = o.ns;

              error = {
                code: 'OBJECT_REQUIRED',
                message: 'Missing required property: ' +
                         properties[properties.length - 1]
              };

              break;
            case 'minimum':
              error = {
                code: 'MINIMUM',
                message: 'Value ' + o.data + ' is less than minimum ' +
                         o.schema.minimum
              };

              break;
            case 'maximum':
              error = {
                code: 'MAXIMUM',
                message: 'Value ' + o.data + ' is greater than maximum ' +
                         o.schema.maximum
              };

              break;
            case 'multipleOf':
              error = {
                code: 'MULTIPLE_OF',
                message: 'Value ' + o.data + ' is not a multiple of ' +
                         o.schema.multipleOf
              };

              break;
            case 'pattern':
              error = {
                code: 'PATTERN',
                message: 'String does not match pattern: ' + o.schema.pattern
              };

              break;
            case 'minLength':
              error = {
                code: 'MIN_LENGTH',
                message: 'String is too short (' + o.data.length + ' chars), ' +
                         'minimum ' + o.schema.minLength
              };

              break;
            case 'maxLength':
              error = {
                code: 'MAX_LENGTH',
                message: 'String is too long (' + o.data.length + ' chars), ' +
                         'maximum ' + o.schema.maxLength
              };

              break;
            case 'minItems':
              error = {
                code: 'ARRAY_LENGTH_SHORT',
                message: 'Array is too short (' + o.data.length + '), ' +
                         'minimum ' + o.schema.minItems
              };

              break;
            case 'maxItems':
              error = {
                code: 'ARRAY_LENGTH_LONG',
                message: 'Array is too long (' + o.data.length + '), maximum ' +
                         o.schema.maxItems
              };

              break;
            case 'uniqueItems':
              error = {
                code: 'ARRAY_UNIQUE',
                message: 'Array items are not unique'
              };

              break;
            case 'minProperties':
              error = {
                code: 'OBJECT_PROPERTIES_MINIMUM',
                message: 'Too few properties defined (' +
                         Object.keys(o.data).length + '), minimum ' +
                         o.schema.minProperties
              };

              break;
            case 'maxProperties':
              error = {
                code: 'OBJECT_PROPERTIES_MAXIMUM',
                message: 'Too many properties defined (' +
                         Object.keys(o.data).length + '), maximum ' +
                         o.schema.maxProperties
              };

              break;
            case 'enum':
              error = {
                code: 'ENUM_MISMATCH',
                message: 'No enum match (' + o.data + '), expects: ' +
                         o.schema['enum'].join(', ')
              };

              break;
            case 'not':
              error = {
                code: 'NOT_PASSED',
                message: 'Data matches schema from "not"'
              };

              break;
            case 'additional':
              properties = o.ns;

              error = {
                code: 'ADDITIONAL_PROPERTIES',
                message: 'Additional properties not allowed: ' +
                         properties[properties.length - 1]
              };

              break;
            case 'format':
              error = {
                code: 'FORMAT',
                message: 'Value does not satisfy format: ' +
                         o.schema.format
              };

              break;
          }
        } catch (err) {
          // ignore errors
        }

        // unhandled errors
        if (!error) {
          error = {
            code: 'FAILED',
            message: 'Validation error: ' + key
          };

          try {
            if (typeof o.validation[key] !== 'boolean') {
              error.message = ' (' + o.validation[key] + ')';
            }
          } catch (err) {
            // ignore errors
          }
        }

        error.code = 'VALIDATION_' + error.code;
        if (o.data !== undefined) error.data = o.data;
        error.path = o.ns;
        errors.push(error);
      });
    } else {
      // handle all non-leaf children
      keys.forEach(function(key) {
        var s;

        if (o.schema.$ref) {
          if (o.schema.$ref.match(/#\/definitions\//)) {
            o.schema = o.definitions[o.schema.$ref.slice(14)];
          } else {
            o.schema = o.schema.$ref;
          }

          if (typeof o.schema === 'string') {
            o.schema = o.env.resolveRef(null, o.schema);
            if (o.schema) o.schema = o.schema[0];
          }
        }

        if (o.schema && o.schema.type) {
          if (allowsType(o.schema, 'object')) {
            if (o.schema.properties && o.schema.properties[key]) {
              s = o.schema.properties[key];
            }

            if (!s && o.schema.patternProperties) {
              Object.keys(o.schema.patternProperties).some(function(pkey) {
                if (key.match(new RegExp(pkey))) {
                  s = o.schema.patternProperties[pkey];
                  return true;
                }
              });
            }

            if (!s && o.schema.hasOwnProperty('additionalProperties')) {
              if (typeof o.schema.additionalProperties === 'boolean') {
                s = {};
              } else {
                s = o.schema.additionalProperties;
              }
            }
          }

          if (allowsType(o.schema, 'array')) {
            s = o.schema.items;
          }
        }

        var opts = {
          env: o.env,
          schema: s || {},
          ns: o.ns.concat(key)
        };

        try {
          opts.data = o.data[key];
        } catch (err) {
          // ignore errors
        }

        try {
          opts.validation = o.validation[key].schema ?
            o.validation[key].schema :
            o.validation[key];
        } catch (err) {
          opts.validation = {};
        }

        try {
          opts.definitions = s.definitions || o.definitions;
        } catch (err) {
          opts.definitions = o.definitions;
        }

        errors = errors.concat(make(opts));
      });
    }

    return errors;
  }

  function allowsType(schema, type) {
    if (typeof schema.type === 'string') {
      return schema.type === type;
    }
    if (isArray(schema.type)) {
      return schema.type.indexOf(type) !== -1;
    }
    return false;
  }

  function isArray(obj) {
    if (typeof Array.isArray === 'function') {
      return Array.isArray(obj);
    }
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function formatPath(options) {
    var root = options.hasOwnProperty('root') ?
      options.root : '$';

    var sep = options.hasOwnProperty('sep') ?
      options.sep : '.';

    return function(error) {
      var path = root;

      error.path.forEach(function(key) {
        path += key.match(/^\d+$/) ?
          '[' + key + ']' :
          key.match(/^[A-Z_$][0-9A-Z_$]*$/i) ?
            (sep + key) :
            ('[' + JSON.stringify(key) + ']');
      });

      error.path = path;

      return error;
    };
  }

  function jjve(env) {
    return function jjve(schema, data, result, options) {
      if (!result || !result.validation) return [];

      options = options || {};

      if (typeof schema === 'string') { schema = env.schema[schema]; }

      var errors = make({
        env: env,
        schema: schema,
        data: data,
        validation: result.validation,
        ns: [],
        definitions: schema.definitions || {}
      });

      if (errors.length && options.formatPath !== false) {
        return errors.map(formatPath(options));
      }

      return errors;
    };
  }

  // Export for use in server and client.
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = jjve;
  } else if (typeof define === 'function' && define.amd) {
    define('jjve',[],function() { return jjve; });
  } else {
    this.jjve = jjve;
  }
}).call(this);

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

// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define('q_mock',definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else {
        Q = definition();
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if( window.jasmine || window.mocha ) {
        afterEach( function() {
            flushing = false;
        } );
        requestTick = function () {
            setTimeout(flush, 0);
        };
        return nextTick;
    }



    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don?t need a security guarantee,
// this is just plain paranoid.
// However, this does have the nice side-effect of reducing the size
// of the code by reducing x.call() to merely x(), eliminating many
// hard-to-minify characters.
// See Mark Miller?s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
// engine that has a deployed base of browsers that support generators.
// However, SM's generators use the Python-inspired semantics of
// outdated ES6 drafts.  We would like to support ES6, but we'd also
// like to make it possible to use generators in deployed browsers, so
// we also support Python-style generators.  At some point we can remove
// this block.
var hasES6Generators;
try {
    /* jshint evil: true, nonew: false */
    new Function("(function* (){ yield 1; })");
    hasES6Generators = true;
} catch (e) {
    hasES6Generators = false;
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = deprecate(function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    }, "valueOf", "inspect");

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be fulfilled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = deprecate(function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        });
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it?s a fulfilled promise, the fulfillment value is nearer.
 * If it?s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        !window.Touch &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        console.warn("Unhandled rejection reason:", reason);
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;
            if (hasES6Generators) {
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return result.value;
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return exception.value;
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

Promise.prototype.timeout = function (ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/testing/http_mock',[
   'q_mock',
   '../utilities/object',
   '../utilities/string'
], function( qMock, object, string ) {
   'use strict';

   var HTTP_METHODS = [ 'get', 'head', 'post', 'put', 'delete' ];

   /**
    * A http client mock for unit tests. All mocked http methods (like e.g. `get`, `post` or `put`) are being
    * spied on.
    *
    * @param {$q} q
    *    a promise library conforming to AngularJS's `$q`
    *
    * @constructor
    */
   function HttpMock( q ) {
      this.q_ = q || qMock;
      this.history = [];
      this.responseMap = {};

      this.reset();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * A list of all http activities that took place so far. Each entry is a string consisting of the http
    * method, a boolean flag indicating whether the request could be handled successfully, the requested
    * url and the time stamp of the request. Use this for debugging purposes in your test case only.
    *
    * @type {Array}
    */
   HttpMock.prototype.history = null;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * A map of http methods to maps of urls to the mocked response objects.
    *
    * @type {Object}
    */
   HttpMock.prototype.responseMap = null;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Resets the http mock by deleting all response mocks and the history recorded so far.
    */
   HttpMock.prototype.reset = function() {
      this.history = [];
      this.responseMap = {};

      HTTP_METHODS.forEach( function( method ) {
         this.responseMap[ method.toUpperCase() ] = {};
      }.bind( this ) );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets a new mocked http response. If a response for the given method / uri combination already exists,
    * it will be overwritten. If `response` is `null`, the entry is deleted. Use this method instead of
    * `respondWith`, if a more sophisticated response should be simulated or failed requests using a status
    * code of `404` for example.
    *
    * @param {String} method
    *    the http method to mock
    * @param {String} uri
    *    the uri to mock the response for
    * @param {Object} response
    *    the response object, probably with `status`, `data` and `headers` fields
    */
   HttpMock.prototype.setHttpResponse = function( method, uri, response ) {
      if( method === 'DEL' ) {
         method = 'DELETE';
      }

      if( response == null ) {
         delete this.responseMap[ method ][ uri ];
      }
      else {
         this.responseMap[ method ][ uri ] = response;
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Sets a response for a status code of `200` without any headers. Thus only the `data` field must be
    * given for the response. If `data` is `null`, the entry is deleted.
    *
    * @param {String} [optionalMethod]
    *    the http method to use. If omitted, `GET` is assumed
    * @param {String} uri
    *    the uri to mock the response for
    * @param {Object} data
    *    the payload of the response
    */
   HttpMock.prototype.respondWith = function( optionalMethod, uri, data ) {
      var method = optionalMethod;
      if( arguments.length < 3 ) {
         data = uri;
         uri = optionalMethod;
         method = 'GET';
      }

      if( method === 'DEL' ) {
         method = 'DELETE';
      }

      if( data == null ) {
         delete this.responseMap[ method ][ uri ];
      }
      else {
         this.responseMap[ method ][ uri ] = {
            data: endsWith( uri, '.json' ) ? JSON.stringify( data ) : data,
            status: 200
         };
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   HttpMock.prototype.createResponse_= function( method, uri, transform ) {
      if( method === 'DEL' ) {
         method = 'DELETE';
      }

      // Emulate the AngularJS-responseTransform option
      transform = Array.isArray( transform ) ? chainTransform( transform ) : ( transform || defaultTransform );

      var deferred  = this.q_.defer();
      var responses = this.responseMap[ method ];
      var response  = responses ? object.deepClone( responses[ uri ] ) : null;

      var success = response != null && response.status >= 200 && response.status < 300;

      this.history.push( method + ' ' + success + ' ' + uri + ' (' + ( new Date() ).getTime() + ')' );

      if( success ) {
         if( response && response.data !== null ) {
            response.data = transform( response.data );
         }
         deferred.resolve( response );
      }
      else if( response ) {
         deferred.reject( response );
      }
      else {
         deferred.reject(
            'nothing found for uri "' + uri + '" in ' + JSON.stringify( this.responseMap )
         );
      }

      return deferred.promise;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function chainTransform( transforms ) {
         return function( response ) {
            return transforms.reduce( function( f, acc ) { return f( acc ); }, response );
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function defaultTransform( response ) {
         return endsWith( uri, '.json' ) ? JSON.parse( response ) : response;
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   [ 'del' ].concat( HTTP_METHODS ).forEach( function( method ) {
      HttpMock.prototype[ method ] = function( uri, dataOrConfig, optionalConfig ) {
         var config = arguments.length === 3 ? optionalConfig : dataOrConfig;

         var promise = this.createResponse_( method.toUpperCase(), uri, ( config || {} ).transformResponse );
         promise.success = createSuccessHandler( promise, config );
         promise.error = createErrorHandler( promise, config );

         return promise;
      };
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSuccessHandler( promise, config ) {
      return function( successHandler ) {
         promise.then( function( response ) {
            successHandler( response.data, response.status, response.headers, config );
         } );

         return promise;
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createErrorHandler( promise, config ) {
      return function( errorHandler ) {
         promise.then( null, function( response ) {
            errorHandler( response.data, response.status, response.headers, config );
         } );

         return promise;
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function endsWith( inputString, suffix, optionalIgnoreCase ) {
      inputString = optionalIgnoreCase ? inputString.toLowerCase() : inputString;
      suffix = optionalIgnoreCase ? suffix.toLowerCase() : suffix;

      return inputString.indexOf( suffix, inputString.length - suffix.length) !== -1;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      create: function( optionalQ ) {
         var instance = new HttpMock( optionalQ );

         [ 'del' ].concat( HTTP_METHODS ).forEach( function( method ) {
            instance[ method ] = jasmine.createSpy( method ).andCallFake( function() {
               return HttpMock.prototype[ method ].apply( instance, arguments );
            } );
         } );

         return instance;
      }

   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/testing/jquery_mock',[
   'jquery'
], function( $ ) {
   'use strict';

   var origMethods = {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Mocks the result to a jQuery method call. The mocked result is only returned if `selectorOrElement`
    * matches either the selector or the DOM element the jQuery object was created with.
    *
    * @param {String} method
    *    name of the method to mock the result for
    * @param {String|HTMLElement} selectorOrElement
    *    the selector or DOM element for which the mocked result is returned
    * @param {*} result
    *    the mocked result
    */
   $.mockResult = function( method, selectorOrElement, result ) {
      var callOrigMethod = $.fn[ method ];
      if( !( method in origMethods ) ) {
         origMethods[ method ] = $.fn[ method ];
      }

      $.fn[ method ] = function() {
         // if no selector was set, the jquery object was initialized using a DOM element.
         var compareWith = this.selector ? this.selector : this[0];
         if( compareWith === selectorOrElement ) {
            return result;
         }

         return callOrigMethod.apply( this, arguments );
      };
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Mocks the call to a jQuery method. The mock method is only called if `selectorOrElement` matches either
    * the selector or the DOM element the jQuery object was created with.
    *
    * @param {String} method
    *    name of the method to mock the result for
    * @param {String|HTMLElement} selectorOrElement
    *    the selector or DOM element for which the mocked result is returned
    * @param {Function} mockMethod
    *    the function to call instead of the original one
    */
   $.mockMethod = function( method, selectorOrElement, mockMethod ) {
      var callOrigMethod = $.fn[ method ];
      if( !( method in origMethods ) ) {
         origMethods[ method ] = $.fn[ method ];
      }

      $.fn[ method ] = function() {
         // if no selector was set, the jquery object was initialized using a DOM element.
         var compareWith = this.selector ? this.selector : this[0];
         if( compareWith === selectorOrElement ) {
            return mockMethod.apply( this, arguments );
         }

         return callOrigMethod.apply( this, arguments );
      };
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Removes all mocked methods and results from jQuery and reattaches the original implementations.
    */
   $.mockReset = function() {
      for( var method in origMethods ) {
         if( origMethods.hasOwnProperty( method ) ) {
            $.fn[ method ] = origMethods[ method ];
         }
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return $;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/testing/matchers',[], function() {
   'use strict';

   var ANY = {};
   var ANY_REMAINING = {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function toContainAllOf( expected ) {
      for( var i=0; i < expected.length; ++i ) {
         /*jshint validthis:true*/
         if( this.actual.indexOf( expected[ i ] ) === -1 ) {
            return false;
         }
      }

      return true;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function objectsMatch( actual, expected ) {
      for( var key in expected ) {
         if( expected.hasOwnProperty( key ) ) {
            if( !matches( actual[ key ], expected[ key ] ) ) {
               return false;
            }
         }
      }

      for( key in actual ) {
         if( actual.hasOwnProperty( key ) && !expected.hasOwnProperty( key ) ) {
            return false;
         }
      }

      return true;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function matches( actual, expected ) {
      if( ANY === expected ) {
         return true;
      }

      if( actual === expected ) {
         return true;
      }

      if( typeof expected === 'object' && expected ) {
         return objectsMatch( actual, expected ) ;
      }

      if( Array.isArray( expected ) ) {
         return arraysMatch( actual, expected );
      }

      return false;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // NEEDS FIX C: This method shadows jasmine's toMatch method for regular expressions and thus should be
   // renamed.
   function toMatch( expected ) {
      /*jshint validthis:true*/
      return matches( this.actual, expected );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function arraysMatch( actualElements, expectedElements ) {

      if( !Array.isArray( actualElements ) ) {
         return false;
      }

      var expectedArgument;

      for( var i=0; i < expectedElements.length; ++i ) {
         expectedArgument = expectedElements[ i ];

         if( expectedArgument === ANY ) {
            continue;
         }

         if( expectedArgument === ANY_REMAINING ) {
            return true;
         }

         if( actualElements.length <= i ) {
            return false;
         }

         if( !matches( actualElements[ i ], expectedArgument ) ) {
            return false;
         }
      }

      return true;
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function toHaveBeenInvokedWith() {
      /*jshint validthis:true*/
      var calls = this.actual.calls;
      var argumentList = [].slice.call( arguments, 0 );

      for( var i=0; i < calls.length; ++i ) {
         if( arraysMatch( calls[ i ].args, argumentList ) ) {
            return true;
         }
      }

      return false;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return  {
      ANY: ANY,
      ANY_REMAINING: ANY_REMAINING,

      /**
       * @param {Object} spec
       *    the spec to add the matchers to
       */
      addTo: function( spec ) {
         spec.addMatchers( {
            toContainAllOf: toContainAllOf,
            toHaveBeenInvokedWith: toHaveBeenInvokedWith,
            toMatch: toMatch
         } );
      }
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/testing/portal_mocks',[
   'q_mock',
   '../utilities/assert',
   '../event_bus/event_bus',
   './matchers',
   './http_mock'
], function( qMock, assert, EventBus, matchers, httpMock ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createQMock() {
      return qMock;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createTickMock() {
      var nextTick = function( callback, timeout ) {
         nextTick.spy();
         return window.setTimeout( callback, timeout || 0 );
      };
      nextTick.spy = jasmine.createSpy( 'nextTickSpy' );
      nextTick.cancel = function( tickRef ) {
         window.clearTimeout( tickRef );
      };
      return nextTick;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createEventBusMock() {
      EventBus.init( createQMock(), createTickMock(), createTickMock() );
      jasmine.Clock.useMock();
      var eventBus = EventBus.create();

      spyOn( eventBus, 'subscribe' ).andCallThrough();
      spyOn( eventBus, 'publish' ).andCallThrough();
      spyOn( eventBus, 'publishAndGatherReplies' ).andCallThrough();

      return eventBus;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createFileResourceProviderMock( filesByUri ) {
      assert( filesByUri ).hasType( Object ).isNotNull();

      var q = createQMock();
      var mock = {
         isAvailable: function( uri ) {
            return q.when( uri in filesByUri );
         },
         provide: function( uri ) {
            if( !(uri in filesByUri) ) {
               return q.reject();
            }
            var entry = filesByUri[ uri ];
            return q.when( typeof( entry ) === 'string' ? entry : JSON.parse( JSON.stringify( entry ) ) );
         }
      };

      spyOn( mock, 'isAvailable' ).andCallThrough();
      spyOn( mock, 'provide' ).andCallThrough();

      return mock;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createHeartbeatMock() {
      var nextTick = createTickMock();

      var beforeNext = [];
      var next = [];
      var afterNext = [];

      function run() {
         [ beforeNext, next, afterNext ].forEach( function( queue ) {
            while( queue.length ) { queue.shift()(); }
         } );
      }

      var mock = {
         onBeforeNext: function( f ) {
            beforeNext.push( f );
         },
         onNext: function( f ) {
            next.push( f );
            nextTick( run );
         },
         onAfterNext: function( f ) {
            afterNext.push( f );
         },
         // Mock only: reset internal state
         _reset: function() {
            beforeNext = [];
            next = [];
            afterNext = [];
         }
      };

      spyOn( mock, 'onNext' ).andCallThrough();
      spyOn( mock, 'onAfterNext' ).andCallThrough();
      spyOn( mock, 'onBeforeNext' ).andCallThrough();

      return mock;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createTimestampMock() {
      return jasmine.Clock.installed.nowMillis;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      mockQ: createQMock,
      mockTick: createTickMock,
      mockHttp: httpMock.create,
      mockEventBus: createEventBusMock,
      mockFileResourceProvider: createFileResourceProviderMock,
      mockHeartbeat: createHeartbeatMock,
      mockTimestamp: createTimestampMock,

      any: function() { return matchers.ANY; },
      anyRemaining: function() { return matchers.ANY_REMAINING; },

      addMatchersTo: function( spec ) {
         matchers.addTo( spec );
      }
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/testing/portal_mocks_angular',[
   'jquery',
   'angular-mocks',
   '../utilities/fn',
   '../utilities/object',
   '../utilities/string',
   '../event_bus/event_bus',
   '../logging/log',
   '../widget_adapters/adapters',
   '../loaders/widget_loader',
   '../runtime/theme_manager',
   './portal_mocks'
], function( $, angularMocks, fn, object, string, eventBusModule, log, adapters, widgetLoaderModule, themeManager, portalMocks ) {
   'use strict';

   var TICK_CONSTANT = 101;

   log.setLogThreshold( log.level.TRACE );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /** @deprecated: this should be removed in the future */
   function createWidgetConfigurationMock() {
      return {
         id: 'testWidgetId',
         specification: {
            name: 'test/test_widget',
            description: 'test widget',
            integration: {
               type: 'widget',
               technology: 'angular'
            },
            features: {
               $schema: 'http://json-schema.org/draft-04/schema#',
               type: 'object',
               additionalProperties: true
            }
         }
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a test bed for widget controller tests.
    *
    * @param {String} widgetPathOrModule
    *    The path that can be used to load this widget into a page (e.g. 'ax-some-widget', 'laxar/my_widget').
    *    For backwards-compatibility, an old-style widget module name starting with 'widgets.' may be given
    *    instead (See LaxarJS/laxar#153).
    * @param {String} [controllerName]
    *    the name of the controller. If omitted, "Controller" will be used
    *
    * @return {Object}
    *    A controller test bed having the following properties:
    *
    *    @property {Object}   featureMock  The configured widget features
    *    @property {Object}   eventBusMock The message bus
    *    @property {Object}   injections   Services to inject into the controller
    *    @property {Object}   scope        The controller scope
    *    @property {Function} controller   The controller
    *    @property {Object}   widgetMock   The widget specification @deprecated
    */
   function createControllerTestBed( widgetPathOrModule, controllerName ) {
      jasmine.Clock.useMock();
      mockDebounce();

      var widgetPath;
      var moduleName;
      var fullControllerName;
      if( widgetPathOrModule.indexOf( 'widgets.' ) === 0 ) {
         // old style module name (pre LaxarJS/laxar#153)
         moduleName = widgetPathOrModule;
         widgetPath = moduleName.replace( /^widgets\./, '' ).replace( /\./g, '/' );
         fullControllerName = moduleName + '.' + ( controllerName || 'Controller' );
      }
      else {
         widgetPath = widgetPathOrModule;
         var widget = widgetPath.replace( /(.*[/])?([^/]*)/, '$2' );
         // derive the module from the directory name
         moduleName = widget.replace( /(.)[_-]([a-z])/g, function( _, $1, $2 ) {
            return $1 + $2.toUpperCase();
         } );
         var upperCaseModuleName = moduleName.charAt( 0 ).toUpperCase() + moduleName.slice( 1 );
         fullControllerName = upperCaseModuleName + 'Controller';
      }

      var testBed = {
         moduleName: moduleName,
         controllerName: fullControllerName,
         widgetMock: createWidgetConfigurationMock(),
         tick: function( milliseconds ) {
            jasmine.Clock.tick( milliseconds || 0 );
         },
         nextTick: function() {
            testBed.tick( TICK_CONSTANT );
         },
         // copy of jquery, so that spying on $ methods in widget tests has no effect on the test bed
         $: $.extend( {}, $ )
      };

      initTestBed( testBed );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /** @deprecated widget.json is always used */
      testBed.useWidgetJson = function() {};

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      testBed.setup = function( optionalOptions ) {

         var options = testBed.options = object.options( optionalOptions, {
            defaultLanguageTag: 'en',
            simulatePortalEvents: false,
            theme: 'default',
            onBeforeControllerCreation: null
         } );

         testBed.eventBusMock = createEventBusMock( testBed );

         var widgetConfiguration = {
            id: testBed.widgetMock.id,
            widget: widgetPath,
            area: 'testArea',
            features: object.deepClone( testBed.featuresMock )
         };

         testBed.onBeforeControllerCreation =
            options.onBeforeControllerCreation || testBed.onBeforeControllerCreation || function() {};

         getWidgetLoader( testBed ).load( widgetConfiguration )
            .then( function() {
               testBed.validationFailed = false;
            }, function( err ) {
               testBed.validationFailed = err;
            } );

         jasmine.Clock.tick( 0 );
         if( testBed.validationFailed ) {
            throw testBed.validationFailed;
         }

         if( options.simulatePortalEvents ) {
            simulatePortalEvents( testBed, options );
         }

      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      testBed.tearDown = function() {
         if( testBed.scope && testBed.scope.$destroy ) {
            testBed.scope.$destroy();
         }

         initTestBed( testBed );
         eventBusModule.init( null, null, null );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return testBed;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Publish the following events, which would normally be published by the runtime.
    *  - `didChangeAreaVisibility.testArea.true`
    *  - `didChangeLocale.default` (only if a defaultLanguageTag was given to `testBed.setup`)
    *  - `didChangeTheme.default`
    *  - `beginLifecycleRequest.default`
    *  - `didNavigate.default` with place `testPlace`
    */
   function simulatePortalEvents( testBed, options ) {
      var eventOptions = { sender: 'AxFlowController' };
      var next = mockQ().when();
      next = next.then( function() {
         var visibilityEvent = [ 'didChangeAreaVisibility', 'testArea', 'true' ].join( '.' );
         testBed.eventBusMock.publish( visibilityEvent, {
            area: 'testArea',
            visible: true
         }, { sender: 'VisibilityManager' } );
      } );
      if( options.defaultLanguageTag ) {
         next = next.then( function() {
            return testBed.eventBusMock.publish( 'didChangeLocale.default', {
               locale: 'default',
               languageTag: options.defaultLanguageTag
            }, eventOptions );
         } );
      }
      next.then( function() {
         return testBed.eventBusMock.publish( 'didChangeTheme.default', {
            theme: 'default'
         }, eventOptions );
      } ).then( function() {
         return testBed.eventBusMock.publishAndGatherReplies( 'beginLifecycleRequest.default', {
            lifecycleId: 'default'
         }, eventOptions );
      } ).then( function() {
         return testBed.eventBusMock.publish( 'didNavigate.default', {
            target: 'default',
            place: 'testPlace',
            data: {}
         }, eventOptions );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a mock implementation of the Q API.
    * @see https://github.com/kriskowal/q
    *
    * @return {Object} A Q mock implementation.
    */
   function mockQ( scope ) {
      return scope ? wrapQ( portalMocks.mockQ(), scope ) : portalMocks.mockQ();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function mockAngularTimeout( scope ) {
      var mockTick = portalMocks.mockTick();
      var $timeoutMock = function( callback, timeout ) {
         var cancelled = false;
         mockTick( function() {
            if( !cancelled ) {
               scope.$apply( callback );
            }
         }, timeout );

         return {
            cancel: function() { cancelled = true; }
         };
      };
      return $timeoutMock;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Install an underscore-compatible debounce-mock function that supports the mock-clock.
    * The debounce-mock offers a `debounce.force` method, to process all debounced callbacks on demand.
    * Additionally, there is a `debounce.waiting` array, to inspect waiting calls with their args.
    */
   function mockDebounce() {

      fn.debounce = debounceMock;
      fn.debounce.force = forceAll;

      fn.debounce.waiting = [];
      function forceAll() {
         fn.debounce.waiting.forEach( function( waiting ) { waiting.force(); } );
         fn.debounce.waiting = [];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function putWaiting( f, context, args, timeout ) {
         var waiting = { force: null, args: args, timeout: timeout };
         waiting.force = function() {
            f.apply( context, args );
            window.clearTimeout( timeout );
            // force should be idempotent
            waiting.force = function() {};
         };
         fn.debounce.waiting.push( waiting );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function removeWaiting( timeout ) {
         fn.debounce.waiting = fn.debounce.waiting.filter( function( waiting ) {
            return waiting.timeout !== timeout;
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * An underscore-compatible debounce that uses the jasmine mock clock.
       *
       * @param {Function} func
       *    The function to debounce
       * @param {Number} wait
       *    How long to wait for calls to settle (in mock milliseconds) before calling through.
       * @param immediate
       *    `true` if the function should be called through immediately, but not after its last invocation
       *
       * @returns {Function}
       *    a debounced proxy to `func`
       */
      function debounceMock( func, wait, immediate ) {
         var timeout, result;
         return function debounceMockProxy() {
            var context = this;
            var args = arguments;
            var timestamp = jasmine.Clock.installed.nowMillis;
            var later = function() {
               var last = jasmine.Clock.installed.nowMillis - timestamp;
               if( last < wait ) {
                  timeout = window.setTimeout( later, wait - last );
                  putWaiting( func, context, args, timeout );
               }
               else {
                  removeWaiting( timeout );
                  timeout = null;
                  if( !immediate ) {
                     result = func.apply(context, args);
                  }
               }
            };

            var callNow = immediate && !timeout;
            if( !timeout ) {
               timeout = window.setTimeout( later, wait );
               putWaiting( func, context, args, timeout );
            }
            if( callNow ) {
               if( timeout ) { removeWaiting( timeout ); }
               result = func.apply( context, args );
            }
            return result;
         };
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function wrapQ( q, scope ) {
      var wrapper = object.options( {}, q );
      var originalDefer = wrapper.defer;

      wrapper.defer = function() {
         var deferred = originalDefer.apply( wrapper, arguments );
         var originalResolve = deferred.resolve;

         deferred.resolve = function() {
            var resolved = originalResolve.apply( deferred, arguments );
            if( scope.$$phase === null ) {
               scope.$digest();
            }

            return resolved;
         };

         return deferred;
      };

      return wrapper;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function initTestBed( testBed ) {
      testBed.featuresMock = {};
      testBed.injections = {};

      delete testBed.scope;
      delete testBed.controller;

      return testBed;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createEventBusMock( testBed ) {
      var timeoutFunction = function( cb, timeout ) {
         setTimeout( function() {
            cb();
            if( !testBed.scope.$$phase ) {
               testBed.scope.$digest();
            }
         }, timeout || 0 );
      };
      eventBusModule.init( portalMocks.mockQ(), timeoutFunction, timeoutFunction );

      var eventBusMock = eventBusModule.create();

      spyOn( eventBusMock, 'subscribe' ).andCallThrough();
      spyOn( eventBusMock, 'publish' ).andCallThrough();
      spyOn( eventBusMock, 'publishAndGatherReplies' ).andCallThrough();

      return eventBusMock;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var cache = {};
   var misses = {};
   function getWidgetLoader( testBed ) {
      var q = portalMocks.mockQ();
      var fileResourceProvider = {
         provide: function( url ) {
            var deferred = q.defer();
            if( cache[ url ] ) {
               deferred.resolve( object.deepClone( cache[ url ] ) );
            }
            else if( misses[ url ] ) {
               deferred.reject( misses[ url ] );
            }
            else {
               // Support for very old servers: undefined by default to infer type from response header.
               var dataTypeGuess;
               if( url.indexOf( '.json' ) === url.length - 5 ) {
                  dataTypeGuess = 'json';
               }
               testBed.$.support.cors = true;
               testBed.$.ajax( {
                  url: url,
                  dataType: dataTypeGuess,
                  async: false,
                  success: function( data ) {
                     cache[ url ] = object.deepClone( data );
                     deferred.resolve( data );
                  },
                  error: function( xhr, status, err ) {
                     misses[ url ] = err;
                     deferred.reject( err );
                  }
               } );
            }

            return deferred.promise;
         },
         isAvailable: function( url ) {
            return fileResourceProvider.provide( url )
               .then( function() {
                  return true;
               }, function() {
                  return false;
               } );
         }
      };

      adapters.addAdapters( [ portalMocksAngularAdapter( testBed ) ] );

      return widgetLoaderModule
         .create( q, fileResourceProvider, themeManager.create( fileResourceProvider, q, 'default' ), { load: function() {} }, testBed.eventBusMock );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function mockVisibilityService() {
      var mockVisibility = false;
      var showHandler = function( visible ) {};
      var hideHandler = function( visible ) {};
      var changeHandler = function( visible ) {};

      var mock = {
         handlerFor: function() {
            var handlerMock = {
               onShow: function( f ) { showHandler = f; },
               onHide: function( f ) { hideHandler = f; },
               onChange: function( f ) { changeHandler = f; },
               isVisible: function() { return mockVisibility; }
            };
            spyOn( handlerMock, 'onShow' ).andCallThrough();
            spyOn( handlerMock, 'onHide' ).andCallThrough();
            spyOn( handlerMock, 'onChange' ).andCallThrough();
            spyOn( handlerMock, 'isVisible' ).andCallThrough();
            return handlerMock;
         },
         _setMockVisibility: function( newValue ) {
            if( newValue === mockVisibility ) {
               return;
            }
            mockVisibility = newValue;
            if( newValue ) {
               showHandler( true );
               changeHandler( true );
            }
            else {
               hideHandler( false );
               changeHandler( false );
            }

         }
      };

      spyOn( mock, 'handlerFor' ).andCallThrough();

      return mock;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var $rootScope = null;
   var $provide;
   var $controller;

   function portalMocksAngularAdapter( testBed ) {

      function create( environment ) {

         if( !testBed._moduleCreated ) {
            angularMocks.module( testBed.moduleName, function( _$provide_ ) {
               $provide = _$provide_;
               $provide.service( 'axGlobalEventBus', function() { return testBed.eventBusMock; } );
            } );
            angularMocks.inject( function( _$rootScope_, _$controller_ ) {
               angularMocks.inject( testBed.onBeforeControllerCreation );
               $rootScope = _$rootScope_;
               // Initialize i18n for i18n controls in non-i18n widgets
               $rootScope.i18n = {
                  locale: 'default',
                  tags: {
                     'default': testBed.options.defaultLanguageTag
                  }
               };
               $controller = _$controller_;
            } );
            testBed._moduleCreated = true;
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function createController() {
            var scope = testBed.scope = $rootScope.$new();
            var eventBus = testBed.scope.eventBus = environment.context.eventBus;

            var injections = object.options( testBed.injections, {
               $scope: scope,
               $q: mockQ( scope ),
               $timeout: mockAngularTimeout( scope ),
               axTimestamp: portalMocks.mockTimestamp,
               axContext: environment.context,
               axEventBus: eventBus
            } );

            scope.features = environment.context.features;
            scope.id = environment.context.id;
            scope.widget = environment.context.widget;

            spyOn( eventBus, 'subscribe' ).andCallThrough();
            spyOn( eventBus, 'publish' ).andCallThrough();
            spyOn( eventBus, 'publishAndGatherReplies' ).andCallThrough();

            testBed.controller = $controller( testBed.controllerName, injections );
            scope.$digest();
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         return {
            createController: createController
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return {
         create: create,
         technology: 'angular'
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      addMatchersTo: portalMocks.addMatchersTo,
      any: portalMocks.any,
      anyRemaining: portalMocks.anyRemaining,
      mockTick: portalMocks.mockTick,
      mockHttp: portalMocks.mockHttp,
      mockTimestamp: portalMocks.mockTimestamp,

      mockVisibilityService: mockVisibilityService,
      createControllerTestBed: createControllerTestBed,
      mockDebounce: mockDebounce,
      mockQ: mockQ
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/testing/run_spec',[
   'require',
   'jquery',
   'angular-mocks',
   '../utilities/path'
], function( require, $, angularMocks, path, paths ) {
   'use strict';

   function runSpec( laxarSpec, jasmineEnv ) {
      if( laxarSpec.title ) {
         document.title = laxarSpec.title;
      }

      var specUrl = laxarSpec.specUrl || dirname( window.location.href );
      var widgetJsonUrl = (typeof laxarSpec.widgetJson === 'undefined' || laxarSpec.widgetJson === true) ?
                          path.join( specUrl, '..', 'widget.json' ) :
                          laxarSpec.widgetJson && path.join( specUrl, laxarSpec.widgetJson );

      var specBase = path.relative( require.toUrl('.'), specUrl );
      var specPrefix = (specBase[0] !== '.') ? './' : '';

      var tests = laxarSpec.tests.map( function( test ) {
         return specPrefix + path.join( specBase, test );
      } );

      if( typeof jasmineEnv === 'undefined' ) {
         jasmineEnv = jasmine.getEnv();

         var htmlReporter = new jasmine.HtmlReporter();

         jasmineEnv.addReporter( htmlReporter );
         jasmineEnv.specFilter = function( spec ) {
            return htmlReporter.specFilter( spec );
         };
      }

      if( widgetJsonUrl ) {
         loadControls( widgetJsonUrl ).then( requireAndRunSpecs );
      } else {
         requireAndRunSpecs( [] );
      }

      function requireAndRunSpecs( controls ) {
         var requirements = controls.concat( tests );
         require( requirements, function() {
            var controlModules = [].slice.call( arguments, 0, controls.length );
            jasmineEnv.beforeEach( function() {
               controlModules.forEach( function( _ ) {
                  angularMocks.module( _.name );
               } );
            } );
            jasmineEnv.execute();
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function loadControls( widgetJsonUrl ) {
      return $.getJSON( widgetJsonUrl ).then( function( widgetJson ) {
         return ( widgetJson && widgetJson.controls ) || [];
      }, function() {
         return $.when( [] );
      } ).then( function( controlReferences ) {
         // Poor man's $q.all:
         var results = [];
         return controlReferences.reduce( function( acc, ref ) {
            // By appending .json afterwards, trick RequireJS into generating the correct descriptor path when
            // loading from a 'package'.
            var url =  require.toUrl( ref + '/control' ) + '.json';
            return acc.then( function() {
               return $.getJSON( url ).then( function( controlJson ) {
                  results.push( ref + '/' + controlJson.name );
               }, function() {
                  results.push( ref );
                  return $.when();
               } );
            } );
         }, $.when() ).then( function() {
            return results;
         } );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function dirname( file ) {
      return file.substr( 0, file.lastIndexOf( '/' ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return runSpec;

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/lib/testing/testing',[
   './http_mock',
   './jquery_mock',
   './matchers',
   './portal_mocks',
   './portal_mocks_angular',
   'q_mock',
   './run_spec'
], function( httpMock, jQueryMock, matchers, portalMocks, portalMocksAngular, qMock, runWidgetSpec ) {
   'use strict';

   return {
      httpMock: httpMock,
      jQueryMock: jQueryMock,
      matchers: matchers,
      portalMocks: portalMocks,
      portalMocksAngular: portalMocksAngular,
      qMock: qMock,
      runSpec: runWidgetSpec
   };

} );

/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( 'laxar/laxar_testing',[
   './laxar',
   './lib/testing/testing'
], function( ax, testing ) {
   'use strict';

   function LaxarTesting() {
      this.testing = testing;
   }
   LaxarTesting.prototype = ax;

   return new LaxarTesting();

} );

