# LaxarJS ShopDemo [![Build Status](https://travis-ci.org/LaxarJS/shop-demo.svg?branch=master)](https://travis-ci.org/LaxarJS/shop-demo)

The LaxarJS ShopDemo shows a simple web shop application (for ordering LaxarJS merchandise) implemented using the [LaxarJS](http://laxarjs.org) web application framework.

It consists of a small set of LaxarJS widgets implemented in [Vue.JS](https://vuejs.org/).

* [Show the live demo](http://laxarjs.github.io/shop-demo/)

* [Read the tutorial](https://github.com/LaxarJS/shop-demo/blob/master/docs/tutorials/01_getting_started.md#getting-started)

* [LaxarJS Homepage](http://laxarjs.org)

* [LaxarJS on GitHub](https://github.com/LaxarJS/laxar)


## Running the ShopDemo

To fetch the required tools and libraries, make sure that you have `npm` (comes with [node.js](https://nodejs.org/en/)) installed on your machine.

Use a shell to issue the following commands:

```console
git clone --single-branch https://github.com/LaxarJS/shop-demo.git
cd shop-demo
npm install
npm start
```

Afterwards, open the demo at [http://localhost:8080/debug.html](http://localhost:8000/debug.html).


## Next Steps

For an optimized version more suitable for production, stop the server (using `Ctrl-C`) and run:
```sh
npm run dist
npm start
```

Now you can browse the optimized demo at [http://localhost:8080/](http://localhost:8000/).

Having built the demo, instead of using `npm start`, you can use any web server on your machine by having it serve the `shop-demo` directory.

Try modifying [the widgets](./application/widgets/) or [the pages](./application/pages/) to get a feel for how a LaxarJS application works.

Read the [tutorial](https://github.com/LaxarJS/shop-demo/blob/master/docs/tutorials/01_getting_started.md#getting-started) to get further information about the LaxarJS techniques.
