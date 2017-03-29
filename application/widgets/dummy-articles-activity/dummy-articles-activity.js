/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import { articles as entries } from './articles';

export const injections = [ 'axEventBus', 'axFeatures' ];
export function create( eventBus, features ) {
   eventBus.subscribe( 'beginLifecycleRequest', () => {
      const { resource } = features.articles;
      eventBus.publish( `didReplace.${resource}`, { resource, data: { entries } } );
   } );
}
