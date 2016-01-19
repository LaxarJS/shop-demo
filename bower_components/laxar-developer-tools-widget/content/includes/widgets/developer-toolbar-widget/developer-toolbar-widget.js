/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
define( [
   'laxar',
   'angular',
   'jquery',
   'laxar-patterns'
], function( ax, ng, $, axPatterns ) {
   'use strict';

   // This controller performs heavy DOM-manipulation, which you would normally put into a directive.
   // However, only the DOM of the host application is manipulated, so this is acceptable.

   Controller.$inject = [ 'axEventBus', '$scope', '$window' ];

   function Controller( eventBus, $scope, $window ) {

      var TABS = [
         { name: 'events', label: 'Events' },
         { name: 'page', label: 'Page' },
         { name: 'log', label: 'Log' }
      ];

      $scope.resources = {};
      axPatterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'grid', { } );

      $scope.model = {
         tabs: TABS,
         activeTab: null,
         gridOverlay: false,
         widgetOverlay: false
      };

      axPatterns.visibility.handlerFor( $scope, { onAnyAreaRequest: function( event ) {
         var prefix = $scope.widget.id + '.';
         var activeTab = $scope.model.activeTab;
         return event.visible && activeTab !== null && event.area === prefix + activeTab.name;
      } } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      eventBus.subscribe( 'didNavigate', function( event ) {
         var newName = event.data[ $scope.features.tabs.parameter ];
         var newTab = TABS.filter( function( _ ) { return _.name === newName; } )[ 0 ];
         if( !newTab ) {
            return;
         }

         if( $scope.model.activeTab !== newTab ) {
            publishVisibility( $scope.model.activeTab, false );
            publishVisibility( newTab, true );
         }
         $scope.model.activeTab = newTab;

         function publishVisibility( tab, visible ) {
            if( tab ) {
               var area = $scope.widget.id + '.' + tab.name;
               axPatterns.visibility.requestPublisherForArea( $scope, area )( visible );
            }
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.activateTab = function( tab ) {
         var data = {};
         data[ $scope.features.tabs.parameter ] = tab.name;
         eventBus.publish( 'navigateRequest._self', {
            target: '_self',
            data: data
         } );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.toggleGrid = function() {
         var $grid = gridVisualizationLayer();
         if( $grid.is( ':hidden' ) ) {
            $grid.show();
            $scope.model.gridOverlay = true;
         }
         else {
            $grid.hide();
            $scope.model.gridOverlay = false;
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.toggleWidgetOutline = function() {
         var $widgets = $( '[data-ax-widget-area]', applicationWindow().document ).children();
         $widgets.toggleClass( 'ax-widget-outline' );
         if( $widgets.is( '.ax-widget-outline' ) ) {
            $widgets.on( 'mouseenter.axDeveloperToolbarWidget', function() {
               var widgetClass = this.className.split( /\s+/ ).filter( function( _ ) {
                  return !!_.match( /(-widget|-activity)$/ );
               } ).concat( 'unknown' )[ 0 ];
               infoLayer().html( '<strong>' + widgetClass + '</strong><br>ID: ' + this.id );
            } );
            $scope.model.widgetOverlay = true;
         }
         else {
            $widgets.off( 'mouseenter.axDeveloperToolbarWidget' );
            infoLayer().remove();
            $scope.model.widgetOverlay = false;
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function applicationWindow() {
         return $window.opener || $window.parent || $window;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function gridVisualizationLayer() {
         var id = $scope.id( 'axGrid' );
         var hostDocument = applicationWindow().document;
         var $grid = $( '#' + id, hostDocument );

         var resourceSettings = $scope.resources.grid;
         if( !$grid.length ) {
            var css = cssSettings( ax.object.options( {}, resourceSettings.css ), resourceSettings.columns );

            $grid = $( '<div></div>', hostDocument ).attr( 'id', id ).hide().css( css );
            $( resourceSettings.anchor, hostDocument ).prepend( $grid );
         }

         return $grid;

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function cssSettings( css, columnSettings ) {

            if( !css.padding ) {
               css.padding = '0 ' + columnSettings.padding + 'px';
            }

            if( !css[ 'background-position' ] ) {
               css[ 'background-position' ] = columnSettings.padding + 'px 0';
            }

            if( !css[ 'background-image' ] ) {
               css[ 'background-image' ] =
               'url("' + columnBackgroundUri( columnSettings ) + '")';
            }

            if( !css.width ) {
               css.width = ( columnSettings.count * columnSettings.width +
                             (columnSettings.count - 1 ) * columnSettings.gutter ) + 'px';
            }

            return css;
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function columnBackgroundUri( settings ) {
            var bgCanvas = document.createElement( 'canvas' );
            var height = 64;
            bgCanvas.width = settings.width + settings.gutter;
            bgCanvas.height = height;
            var context = bgCanvas.getContext( '2d' );
            // padding
            context.fillStyle = 'rgba(229, 111, 114, 0.25)';
            context.fillRect( 0, 0, settings.padding, height );
            context.fillRect( settings.width - settings.padding, 0, settings.padding, height );
            // column
            context.fillStyle = 'rgba(229, 111, 114, 0.4)';
            context.fillRect( settings.padding, 0, settings.width - 2*settings.padding, height );
            return bgCanvas.toDataURL();
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function infoLayer() {
         var id = $scope.id( 'axInfo' );
         var hostDocument = applicationWindow().document;
         var $info = $( '#' + id, hostDocument );
         if( !$info.length ) {
            $info = $( '<div></div>', { id: id, css: INFO_LAYER_STYLE } )
               .appendTo( hostDocument.body )
               .on( 'click', function() {
                  $info.remove();
               } );
         }
         return $info;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var INFO_LAYER_STYLE = {
      position: 'fixed',
      top: -5,
      left: -5,
      'box-shadow': '2px 2px 15px rgba(0,0,0,0.5)',
      'z-index': 1000,
      padding: '0.5em 1em 0.75em',
      'border-right': '1px solid white',
      'border-bottom': '1px solid white',
      'border-radius': '0 0 20px 0',
      backgroundColor: '#ff9900',
      color: 'white'
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'developerToolbarWidget', [] )
      .controller( 'DeveloperToolbarWidgetController', Controller );

} );
