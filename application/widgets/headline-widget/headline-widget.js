/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
export const injections = [ 'axFeatures' ];
export function create( features ) {
   return {
      onDomAvailable( dom ) {
         [ 'headline', 'intro' ].forEach( feature => {
            const html = features[ feature ].htmlText;
            const element = dom.querySelector( `.${feature}-html-text` );
            if( html ) {
               element.innerHTML = html;
            }
            else {
               element.remove();
            }
         } );
      }
   };
}
