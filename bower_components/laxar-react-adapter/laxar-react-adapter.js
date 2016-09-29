/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [ 'react-dom' ], function( ReactDom ) {
   'use strict';

   var widgetModules = {};

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Implements the LaxarJS adapter API:
    * https://github.com/LaxarJS/laxar/blob/master/docs/manuals/adapters.md
    */
   return {
      technology: 'react',
      bootstrap: bootstrap,
      create: create,
      applyViewChanges: function() {}
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function bootstrap( modules ) {
      modules
         .filter( function ( module ) { return module.name; } )
         .forEach( function( module ) {
            widgetModules[ module.name ] = module;
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function create( environment, services ) {

      var isAttached = true;
      var exports = {
         createController: createController,
         domAttachTo: domAttachTo,
         domDetach: domDetach,
         destroy: function() {}
      };

      var widgetName = environment.specification.name;
      var context = environment.context;
      var controller = null;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createController( config ) {
         var widgetModule = widgetModules[ widgetName ];
         var injector = createInjector();
         var injections = ( widgetModule.injections || [] ).map( function( injection ) {
            return injector.get( injection );
         } );
         config.onBeforeControllerCreation( environment, injector.get() );
         controller = widgetModule.create.apply( widgetModule, injections );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function domAttachTo( areaElement ) {
         isAttached = true;
         areaElement.appendChild( environment.anchorElement );
         controller.onDomAvailable();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function domDetach() {
         isAttached = false;
         var parent = environment.anchorElement.parentNode;
         if( parent ) {
            parent.removeChild( environment.anchorElement );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createInjector() {
         var map = {
            axContext: context,
            axEventBus: context.eventBus,
            axFeatures: context.features || {},
            axReactRender: function( componentInstance ) {
               if( isAttached ) {
                  ReactDom.render(
                     componentInstance,
                     environment.anchorElement
                  );
               }
            }
         };

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         return {
            get: function( name ) {
               if( arguments.length === 0 ) {
                  return map;
               }

               if( name in map ) {
                  return map[ name ];
               }

               if( name in services ) {
                  return services[ name ];
               }

               throw new Error( 'laxar-react-adapter: Unknown dependency: "' + name + '"' );
            }
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      return exports;

   }

} );
