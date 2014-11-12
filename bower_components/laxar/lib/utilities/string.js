/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [], function() {
   'use strict';

   var DEFAULT_FORMATTERS = {
      's': function( input, subSpecifierString ) {
         return '' + input;
      },

      'd': function( input, subSpecifierString ) {
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

      'o': function( input, subSpecifierString ) {
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
    * Returns `true` if the first argument ends with the string given as second argument.
    *
    * @param {String} inputString
    *    test subject
    * @param {String} suffix
    *    string to find as tail
    * @param {Boolean} [optionalIgnoreCase]
    *    if `true` case insensitive matching takes place.  Default is `false`
    *
    * @return {Boolean}
    *    `true` if suffix is the tail of inputString
    */
   function endsWith( inputString, suffix, optionalIgnoreCase ) {
      inputString = optionalIgnoreCase ? inputString.toLowerCase() : inputString;
      suffix = optionalIgnoreCase ? suffix.toLowerCase() : suffix;

      return inputString.indexOf( suffix, inputString.length - suffix.length) !== -1;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Expects an upper-case string with underscores and creates a new string in the corresponding camel-
    * case notation, i.e. `SOME_NICE_FEATURE` will be converted to `someNiceFeature`. If there are n
    * successive underscores for n > 1, they will be transformed to n-1 underscores in the resulting string.
    * This can be prevented by passing the `removeAllUnderscores` parameter as `true`. In that case the
    * first character is always transformed to lower case.
    *
    * @param {String} inputString
    *    the uppercase-underscore string
    * @param {Boolean} [removeAllUnderscores]
    *    if `true` all underscores will be removed
    *
    * @return {String}
    *    the string transformed to camelcase
    */
   function upperCaseToCamelCase( inputString, removeAllUnderscores ) {
      var result = inputString.toLowerCase()
         .replace( /([_]+)([a-z])/g, function( match, underscores, character, offset ) {
            var remainingUnderScores = offset > 0 ? underscores.substr( 1 ) : underscores;
            return remainingUnderScores + character.toUpperCase();
         } );

      if( removeAllUnderscores === true ) {
         result = result.replace( /_*/g, '' );
         return result.charAt( 0 ).toLowerCase() + result.slice( 1 );
      }

      return result;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Removes all underscores from an otherwise camel-case formatted string. Those strings result e.g. from
    * generated id's, where there is a prefix taken from a component type, combined with an generated id,
    * separated by `__`. Example: `accordion_widget__id0` will result in `accordionWidgetId0`
    *
    * @param {String} inputString
    *    the camel-case string to remove all underscores from
    *
    * @return {String}
    *    the camel case string with all underscores removed
    */
   function removeUnderscoresFromCamelCase( inputString ) {
      return inputString.replace( /_+([a-z])/g, function( match, char, offset ) {
         return offset > 0 ? char.toUpperCase() : char;
      } ).replace( /_/g, '' );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Returns a new string that equals the `inputString` where the first character is upper-case.
    *
    * @param {String} inputString
    *    the string to capitalize
    *
    * @return {String}
    *    the capitalized string
    */
   function capitalize( inputString ) {
      if( typeof inputString !== 'string' || inputString.length < 1 ) {
         return inputString;
      }
      return inputString.charAt( 0 ).toUpperCase() + inputString.slice( 1 );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * <a name="format"></a>
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
    * by backslashes (thus to get an actual backslash in a JavaScript string literal, it needs to be written
    * as double backslash):
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
    * when creating the `formatString` function using [`createFormatter()`](#createFormatter):
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
    * <a name="createFormatter"></a>
    * Creates a new format function having the same api as [`format()`](#format). If the first argument is
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
    * The second argument is completely additional to the behavior of the default [`format()`](#format)
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
    * @param {Object} [valueMappers]
    *    map from mapping identifier to mapping function
    *
    * @return {Function}
    *    A function having the same api as [`format()`](#format)
    */
   function createFormatter( typeFormatters, valueMappers ) {

      if( !typeFormatters ) {
         typeFormatters = DEFAULT_FORMATTERS;
      }
      if( !valueMappers ) {
         valueMappers = {};
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
               else if( part in valueMappers ) {
                  return valueMappers[ part ]( value );
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
      endsWith: endsWith,
      upperCaseToCamelCase: upperCaseToCamelCase,
      removeUnderscoresFromCamelCase: removeUnderscoresFromCamelCase,
      capitalize: capitalize,
      format: format,
      createFormatter: createFormatter,
      DEFAULT_FORMATTERS: DEFAULT_FORMATTERS
   };

} );
