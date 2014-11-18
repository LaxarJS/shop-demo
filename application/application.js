// See https://github.com/LaxarJS/laxar/blob/master/docs/manuals/configuration.md
window.laxar = ( function() {
   'use strict';

   var modeAttribute = 'data-ax-application-mode';
   var mode = document.querySelector( 'script[' + modeAttribute + ']' ).getAttribute( modeAttribute );

<<<<<<< HEAD
   i18n: {
      locales: {
         'default': 'en_US'
      }
   },

   logging: {
      threshold: 'WARN'
   },

   // relative to laxar-path-root
=======
   return {
      name: 'LaxarJS ShopDemo',
      description: 'A DemoApp to learn how LaxarJS works.',

      portal: {
         theme: 'laxar_demo',
         useMergedCss: mode === 'RELEASE'
      },
>>>>>>> v1.4.0

      file_resource_provider: {
         fileListings: {
            'application': 'var/listing/application_resources.json',
            'bower_components': 'var/listing/bower_components_resources.json',
            'includes': 'var/listing/includes_resources.json'
         },
         useEmbedded: mode === 'RELEASE'
      },

      i18n: {
         locales: {
            'default': 'en'
         }
      }

   };

} )();
