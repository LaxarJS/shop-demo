'use strict';

exports.command = function( ) {
   const SauceLabs = require( 'saucelabs' );

   const saucelabs = new SauceLabs({
      username: process.env.SAUCE_USERNAME,
      password: process.env.SAUCE_ACCESS_KEY
   });

   const sessionid = this.capabilities[ 'webdriver.remote.sessionid' ];

   saucelabs.updateJob( sessionid, {
      passed: this.currentTest.results.failed === 0
   }, () => {});
   return this;
};
