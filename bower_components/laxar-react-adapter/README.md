# LaxarJS React Adapter

> Write LaxarJS widgets and controls in React


## Installation

```console
bower install laxar-react-adapter
```

This will automatically install React if not already installed.

Add the React adapter to your bootstrapping modules, by editing the `init.js` of your LaxarJS project.
You will need to adjust the RequireJS imports, as well as the second argument to `ax.bootstrap`: 

```js
require( [
   /* existing dependencies ... */, 
   'laxar-react-adapter'
], function( /* laxar, applicationModules, resources, ... */, reactAdapter ) {
   // ... setup file listings etc. ...
   ax.bootstrap( /* applicationModules */, [ reactAdapter ] );
} );
```

If you already have other custom adapters in your project, simply add the React adapter to your current list.


## Usage

With the adapter in place, you can now write widgets and controls using React.
The integration technology _"react"_ is very similar to _"plain"_.


### Creating a React Widget

You can use the LaxarJS generator for Yeoman to create a _plain_ widget, then turn it into a React widget:

1. Change the integration technology (in the `widget.json` descriptor) to `"react"`.

2. The widget module (e.g. `my-widget.js`), should export an object with three properties (`name`, `injections`, `create`), just like a plain widget would.
The `create` method should setup the widget controller and subscribe to events.
It must return an object with a function property `onDomAttached` which is called by the React adapter as soon as the widget DOM has been instantiated and attached to teh page DOM.

3. To render something into its dom node, the widget must request the injection `axReactRender` which is provided by the react adapter.
This injected function is a no-op as long as the widget is invisible (e.g. in a background-tab, or within a closed popup).
As soon as the widget has been attached to the page DOM, `axReactRender` goes through to `React.render`.

Here is an example widget controller for a widget named *my-counter-widget*.
It simply subscribes to all takeActionRequest events and keeps displaying a running total of requested actions:

```javascript
define( [ 'react' ], function( React ) {
   return {
      name: 'my-counter-widget',
      injections: [ 'axEventBus', 'axReactRender' ],
      create: function( eventBus, reactRender ) {
         var counter = 0;
         eventBus.subscribe( 'takeActionRequest', function() {
            ++counter;
            render();
         } );
         function render() {
            reactRender(
               React.createElement( 'h1', {}, '#' + counter )
            );
         }

         return { onDomAvailable: render };
      }
   };
} );
```


### Creating a React Control

A LaxarJS control allows you to encapsulates one or more React components with associated CSS styles, that can be overwritten by themes.

React controls are implemented as regular AMD-modules, just like *plain* controls.
Just make sure to specify `"react"` as the integration technology in your `control.json`, and to export all components that you wish to make available to widgets.  


### Using JSX

If you'd like to write your widget- or control-code in JSX, just make sure that the generated .js-file is put in the same place as a handwritten controller, and that AMD-compatible output is generated.
Usually, you can achieve this by using the right editor/tool settings.

Using JSX, the widget controller from above can be simplified:

```jsx
import React from 'react';

export default {
   name: 'my-counter-widget',
   injections: [ 'axEventBus', 'axReactRender' ],
   create: function( eventBus, reactRender ) {
      var counter = 0;
      const render = () => reactRender( <h1>#{counter}</h1> );
      eventBus.subscribe( 'takeActionRequest', () => {
         ++counter;
         render();
      } );

      return { onDomAvailable: render };
   }
};
```

Also, you can delete the `default.theme/my-counter-widget.html` since for React, we do not use HTML template loading mechanism.


### Testing with LaxarJS Mocks

Starting with [laxar-mocks](https://github.com/LaxarJS/laxar-mocks) v0.5.0, you can pass custom adapters when creating the testbed-setup function.
Simply write your specs like this:


```js
define( [
   'json!../widget.json',
   'laxar-react-adapter',
   'laxar-mocks'
], function( descriptor, axReactAdapter, axMocks ) {
   'use strict';

   describe( 'The my-counter-widget', function() {

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         // register the adapter:
         adapter: axReactAdapter,
         // with React JSX, usually we will not use an HTML template:
         knownMissingResources: [ 'default.theme/my-counter-widget.html' ]
      } ) );

      // ... tests ...

      afterEach( axMocks.tearDown );

   } );
} );
```
