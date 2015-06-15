/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
require( [
   'laxar',
   'laxar-application-dependencies',
   'json!laxar-application/var/listing/application_resources.json',
   'json!laxar-application/var/listing/bower_components_resources.json',
   'json!laxar-application/var/listing/includes_resources.json'
], function( ax, applicationDependencies, applicationListing, bowerComponentsListing, includesListing ) {
   'use strict';

   // prepare file listings for efficient asset loading
   window.laxar.fileListings = {
      application: applicationListing,
      bower_components: bowerComponentsListing,
      includes: includesListing
   };

   ax.bootstrap( applicationDependencies );

} );
