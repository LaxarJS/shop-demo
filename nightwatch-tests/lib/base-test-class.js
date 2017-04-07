/*
 * This is an example ' base class'  from which your tests can inherit.
 * See /tests for examples of tests which inherit from this base class.
 * If you need a common setup/teardown (eg: for resetting the state of
 * a mock server, for example), put it in before() and after() in the base
 * class below. All inheritors will get this functionality.
 */
'use strict';

const Base = require( 'testarmada-nightwatch-extra/lib/base-test-class' );
const util = require( 'util' );

const BaseClass = function( steps ) {
   // calls super-constructor
   Base.call( this, steps );
};

util.inherits( BaseClass, Base );

BaseClass.prototype = {
   before(client, callback) {
      Base.prototype.before.call( this, client, () => {
         //call super-after
         callback();
      } );
   },
   after(client, callback) {
      Base.prototype.after.call( this, client, () => {
         //call super-after
         client.reportToSauce();
         setTimeout( () => {
            callback();
         }, 2000 );
      } );
   }
};

module.exports = BaseClass;
