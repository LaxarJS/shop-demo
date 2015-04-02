# LaxarJS ShopDemo

The LaxarJS ShopDemo shows a simple web shop application (for ordering LaxarJS merchandise) implemented using the [LaxarJS](http://laxarjs.org) web application framework.

It consists of a small set of LaxarJS widgets implemented in AngularJS. Storage is realised using PouchDB.

* [Show the live demo](http://laxarjs.github.io/shop_demo/)

* [Read the tutorial](https://github.com/LaxarJS/shop_demo/blob/master/docs/tutorials/01_getting_started.md#getting-started)

* [LaxarJS Homepage](http://laxarjs.org)

* [LaxarJS on GitHub](https://github.com/LaxarJS/laxar)


## Running the ShopDemo

To fetch the required tools and libraries, make sure that you have `npm` (comes with NodeJS) installed on your machine.

Use a shell to issue the following commands:

```sh
git clone --single-branch --recursive https://github.com/LaxarJS/shop_demo.git
cd shop_demo
npm install
npm start
```

Afterwards, open the demo at [http://localhost:8000/debug.html](http://localhost:8000/debug.html).


## Next Steps

For an optimized version more suitable for production, stop the server (using `Ctrl-C`) and run:
```sh
npm run-script dist
npm start
```

Now you can browse the optimized demo at [http://localhost:8000/index.html](http://localhost:8000/index.html).

Instead of using `grunt start`, you can use any web server on your machine by having it serve the `shop_demo` directory.

Try modifying the widgets under `includes/widgets/shop_demo` to get a feel for how a LaxarJS application works.

Read the [tutorial](https://github.com/LaxarJS/shop_demo/blob/master/docs/tutorials/01_getting_started.md#getting-started) to get further information about the LaxarJS techniques.
