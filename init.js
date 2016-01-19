
/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
require( [
   'laxar',
   'laxar-react-adapter',
   'laxar-application/var/flows/main/dependencies',
   'json!laxar-application/var/flows/main/resources.json'
], function( ax, axReactAdapter, mainDependencies, mainResources ) {
   'use strict';

   window.laxar.fileListings = {
      application: mainResources,
      bower_components: mainResources,
      includes: mainResources
   };

   ax.bootstrap( mainDependencies, [ axReactAdapter ] );

} );
