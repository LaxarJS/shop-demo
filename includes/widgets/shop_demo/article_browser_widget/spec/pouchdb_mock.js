/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
define( function() {
   'use strict';
   
   var spies = {
      query: jasmine.createSpy( 'PouchDB.query' )
   };
   
   function PouchDB() {
      return spies;
   }
   
   PouchDB.spies = spies;
   
   return PouchDB;
   
} );
