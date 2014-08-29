/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
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
            data: string.endsWith( uri, '.json' ) ? JSON.stringify( data ) : data,
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
         return string.endsWith( uri, '.json' ) ? JSON.parse( response ) : response;
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