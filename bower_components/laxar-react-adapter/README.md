# LaxarJS React Adapter

> Write LaxarJS widgets and controls in React


## Installation

```console
bower install laxar-react-adapter
```

This will automatically install React if not already installed.

Add the React adapter to your bootstrapping modules, by editing the `init.js` and the `require_config.js` of your LaxarJS project.
You will need to adjust the `paths` object in your RequireJS configuration:

```js
'laxar-react-adapter': 'laxar-react-adapter/laxar-react-adapter',
'react': 'react/react',
'react-dom': 'react/react-dom',
```

The adapter relies on `react-dom`, and your widgets will need to find `react`.
Now you can pass the adapter through the second argument to `ax.bootstrap`:

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
The Laxarjs generator can create simple widgets and controls with the integration technology _"react"_.
Continue reading for details.


### Creating a React Widget

You can use the LaxarJS generator for Yeoman to create a _react_ widget.
by selecting _"react"_ as _integration technology_.
The new widget has a JSX file with a simple widget controller.

For example `myNewWidget.jsx`:

```javascript
import React from 'react';
import ax from 'laxar';

const injections = [ 'axContext', 'axReactRender' ];

function create( context, reactRender ) {

   return {
      onDomAvailable: render
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function render() {
      reactRender( <div></div> );
   }
};

export default {
   name: 'myNewWidget',
   injections: injections,
   create: create
};
```

The controller in this file injects the `axContext` which is a complete object containing all configuration and API specifically available to this widget instance. The injected `axReactRender` is provided by the react adapter. This injected function is a no-op as long as the widget is invisible (e.g. in a background-tab, or within a closed popup). As soon as the widget has been attached to the page DOM, `axReactRender` goes through to `React.render`.

Read the LaxarJS documentation for more about [writing widget controllers](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/writing_widget_controllers.md) and the available injections.


### Creating a React Control

A LaxarJS control allows you to encapsulates one or more React components with associated CSS styles, that can be overwritten by themes.

React controls are implemented as regular AMD-modules, just like *plain* controls.
Select `"react"` as the integration technology when you generate the control with the LaxarJS Yeoman generator.

```javascript
import React from 'react';

const MyReactControl = React.createClass({
render() {
      return <div className='my-new-control'></div>;
   }
} );

export default MyNewControl;
```

In your new control make sure to export all components that you wish to make available to widgets.

Read the LaxarJS documentation for more about [providing controls](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/providing_controls.md).


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
