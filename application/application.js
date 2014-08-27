window.laxar = {
   name: 'LaxarJS ShopDemo',
   description: 'A DemoApp to learn how LaxarJS works.',

   theme: 'default',

   locales: {
      'default': 'en_US',
      'alternative': 'de_DE'
   },

   logThreshold: 'DEVELOP',

   // relative to laxar-path-root
   fileListings: {
      'bower_components/laxar_uikit/themes': 'var/listing/laxar_uikit_themes.json',
      'bower_components/laxar_uikit/controls': 'var/listing/laxar_uikit_controls.json',
      'includes/themes': 'var/listing/includes_themes.json',
      'includes/widgets': 'var/listing/includes_widgets.json',
      'application/layouts': 'var/listing/application_layouts.json'
   }
};
