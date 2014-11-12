window.laxar = {
   name: 'LaxarJS ShopDemo',
   description: 'A DemoApp to learn how LaxarJS works.',

   portal: {
      theme: 'laxar_demo',
      useMergedCss: window.laxarMode === 'RELEASE'
   },

   locales: {
      'default': 'en_US'
   },

   logThreshold: 'DEVELOP',

   // relative to laxar-path-root

   file_resource_provider: {
      // relative to laxar-path-root
      fileListings: {
         'application/pages': 'var/listing/application_pages.json',
         'application/layouts': 'var/listing/application_layouts.json',
         'includes/lib/laxar_uikit': 'var/listing/laxar_uikit.json',
         'includes/themes': 'var/listing/includes_themes.json',
         'includes/widgets': 'var/listing/includes_widgets.json'
      },

      useEmbedded: window.laxarMode === 'RELEASE'
   }

};
