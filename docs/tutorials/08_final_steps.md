# Final Steps

In this final part of the tutorial, you will learn to use a different theme as well as to create an optimized version of your application for production.


## Adding a Second Theme to the Application

The CSS files that we have written for our widgets and layouts only cover the basics that are necessary for displaying our application.
For a more sophisticated styling, let us add another _theme_ based on [Bootstrap CSS](http://getbootstrap.com), called _cube.theme_.
You can obtain the theme from NPM:

```sh
npm install laxar-cube.theme
```

You could also create your own theme under `application/themes/`, using the _cube.theme_ as a template.
The LaxarJS documentation contains a [manual on themes](https://laxarjs.org/docs/laxar-v2-latest/manuals/creating_themes/) related to this shop demo, which goes into more detail.


## Changing the Theme

The theme used by the application can be changed in the file `init.js`, by replacing `"default"` with `"cube"`:

```js
// in the artifacts import:
import artifacts from 'laxar-loader/artifacts?flow=main&theme=cube';

// ...

// and in the LaxarJS application configuration:
const configuration = {
   // name, ...
   theme: 'cube'
};
```

Finally, the webpack configuration needs to be extended to support the SCSS-import paths required by the _cube.theme_.
For this, the following element needs to be added to the `module.rules` array in the `webpack.config.js`:

```js
{
   test: /[/](laxar-)?cube[.]theme[/].*[.]s[ac]ss$/,
   loader: 'sass-loader',
   options: require( 'laxar-cube.theme/sass-options' )
}
```


### Themed SCSS for Layouts and Widgets

This already goes a long way in changing the appearance of the application.
But the individual layouts and widgets will still fall back to their _default.theme_ folders, using the slightly different set of variables from vanilla Bootstrap CSS.
To _fully_ theme your application, you'll have to use SCSS stylesheets that are customized for the cube.theme for some of the artifacts:

  - [application/layouts/one-column/cube.theme/scss/one-column.scss](../../application/layouts/one-column/cube.theme/scss/one-column.scss)
  - [application/layouts/three-columns/cube.theme/scss/three-columns.scss](../../application/layouts/three-columns/cube.theme/scss/three-columns.scss)
  - [application/widgets/article-browser-widget/cube.theme/scss/article-browser-widget.scss](../../application/widgets/article-browser-widget/cube.theme/scss/article-browser-widget.scss)
  - [application/widgets/article-teaser-widget/cube.theme/scss/article-teaser-widget.scss](../../application/widgets/article-teaser-widget/cube.theme/scss/article-teaser-widget.scss)
  - [application/widgets/shopping-cart-widget/cube.theme/scss/shopping-cart-widget.scss](../../application/widgets/shopping-cart-widget/cube.theme/scss/shopping-cart-widget.scss)


After restarting the development server, your application should look similar to this:

<!--
*TODO: screenshot of home-page
-->


## Deploying the Application

The application is now complete and we can prepare an _optimized version_ ready for deployment:

```shell
npm run optimize
```

Start the server with `npm start` and visit the [production version](http://localhost:8080/).

In contrast to the `debug.html`, the optimized version (`index.html`) does not pick up changes automatically.
However, the download size of the application is greatly reduced when using the optimized version, making for a much better user experience, especially on mobile devices.
For this reason, it is strongly recommended to always use this version for production.
In case you are familiar with _webpack_:
The above command simply runs `webpack -p --env.production`.

Of course, when creating you own application, you do not have to use the HTML files provided by the LaxarJS scaffolding _as-is_.
Instead, you should be able to include the relevant sections from the `index.html` file into any server side templating system:
Only the stylesheet reference and the `body` contents (container `div`, `script`) are required.
Depending on you setup, you may need to update the paths to resources under `dist/`.
For more advanced production configuration, consult the [webpack documentation](https://webpack.js.org).


## The Next Step

Go ahead and develop your own application!
Check out the [LaxarJS manuals](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/index.md#manuals) for more information, and get familiar with the [LaxarJS Patterns](https://github.com/LaxarJS/laxar-patterns/blob/master/docs/index.md#laxarjs-patterns) to learn how to create the best and most reusable widgets.

[« The shopping-cart-widget](07_shopping_cart_widget.md)  | Final steps
