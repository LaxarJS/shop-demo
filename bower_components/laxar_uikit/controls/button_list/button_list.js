/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'underscore',
   'text!./default.theme/button_list.html'
], function( _, buttonTemplate ) {
   'use strict';

   /**
    * axButtonList
    * ============
    *
    * Description:
    * ------------
    * The button list directive can be used to render a list of buttons in a very simple way. It is optimized
    * for high-performance in certain usage scenarios. The use of `ngRepeat` is therefore explicitly neglected.
    * It thus has some known (but in our case well acceptable) limitations:
    * * As soon as a non-empty list to the axButtonList binding is available, the according buttons are
    *   rendered in the given order using the template found with the directive.
    * * When the rendering has finished the directive disconnects from future updates to the list. Thus all
    *   changes made to the list won't be reflected in the rendered button list. Changes to items within in
    *   the button will nevertheless be updated in the view thanks to AngularJS' scopes.
    *
    * Usage:
    * ------
    * Bind your list of buttons to the attribute having the directive's name, while keeping above mentioned
    * limitations in mind. In practice this means: *Only fill the list with the buttons when you are sure,
    * that no further modifications to the list will occur.*
    * To get notified of clicks on a button the `ax-button-list-click` attribute can be provided with a bound
    * function call. This call is evaluated in the scope of the according button. Thus the button from the
    * given list is available as `button` to the bound function.
    *
    * Example:
    * --------
    * Template:
    * ```
    *  <div data-ax-button-list="model.buttons" data-ax-button-list-click="handleButtonClicked( button )"></div>
    * ```
    * Widget-Code:
    * ```
    * $scope.model = {
    *    buttons: createFancyListOfButtons()
    * };
    * $scope.handleButtonClicked = function( button ) {
    *    // ... do some stuff
    * }
    * ```
    */


   var DEBOUNCE_TIME_MS = 300;
   var directiveName = 'axButtonList';
   var directive = [ '$compile', '$parse', function( $compile, $parse ) {

      return {
         restrict: 'A',
         scope: true,
         link: function( scope, element, attrs ) {
            var $off = scope.$watch( attrs[ directiveName ], function( newValue ) {
               if( newValue && newValue.length ) {

                  newValue.forEach( function( button ) {
                     var buttonScope = scope.$new();
                     buttonScope.button = button;
                     buttonScope.buttonClicked = _.debounce( function() {
                        buttonScope.$eval( attrs.axButtonListClick );
                     }, DEBOUNCE_TIME_MS, true );

                     element.append( $compile( buttonTemplate )( buttonScope ) );
                  } );

                  $off();
               }
            } );
         }
      };
   } ];

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      createForModule: function( module ) {
         module.directive( directiveName, directive );
      }
   };


} );