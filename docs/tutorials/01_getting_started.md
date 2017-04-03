# Getting Started

This tutorial explains how to create a simple web-based shopping application using [LaxarJS](http://laxarjs.org).
It provides a step-by-step introduction into creating widgets and activities and using them in an application.
The tutorial is intended for developers who are familiar with standard web technologies (HTML, JavaScript) and the basics of a UI-technology such as [*AngularJS*](https://angularjs.org/), [*React*](https://facebook.github.io/react/) or [*Vue.js*](https://vuejs.org/), with Vue.js being used throughout this tutorial.

If you are completely unfamiliar with LaxarJS, you might want to check out [Why LaxarJS](https://github.com/LaxarJS/laxar/blob/master/docs/why_laxar.md) and maybe have a brief look at the [key concepts](https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md) first.

While this tutorial aims to be a comprehensive guide for starters, it will not include and explain every line of code of the whole project.
Instead, each step introduces a new concept of LaxarJS.
Still, links to the relevant project source files are provided from each section.


## Get the Prerequisites

To create projects with LaxarJS, an installation of [*Node.js*](https://nodejs.org) (v6 or later) is required.
Everything else will be obtained as you go:

First, you will need to create a new LaxarJS application.
To simplify this process, install the *Yeoman* scaffolding tool as well as the *Yeoman generator for LaxarJS 2*:

```shell
npm install -g yo generator-laxarjs
```

Depending on your setup you may need to use `sudo` for this.
If you cannot or do not want to modify your global NPM packages, take a look to the section ["local installation" instructions](https://laxarjs.org/docs/generator-laxarjs2-v2-latest/#local-installation) in the [generator documentation](https://laxarjs.org/docs/generator-laxarjs2-v2-latest/).


## Creating a LaxarJS Application

The recommended way to create a LaxarJS application is by using the _Yeoman generator._
Since you just installed the generator, all you need to do is:

```console
mkdir shop-demo
cd shop-demo
yo laxarjs
```

The generator will ask for some details about the application, offering helpful suggestions where possible.
Let us answer the questions of the LaxarJS generator as follows:

*TODO: update to v2 generator*

```console
? The application name: (shop-demo)
? Description (optional): A demo application to learn how LaxarJS works
? Licenses: MIT
? Project homepage (optional): https://www.laxarjs.org
? Author name (optional): LaxarJS
? Should a set of example widgets be generated? No
```

Provided with this information, the generator will create a basic LaxarJS application for you.
It also prepares a `package.json` containing all required dependencies.
To install these dependencies, you will need to run:

```console
npm install
```

Now you can start the [webpack development server](https://webpack.js.org/configuration/dev-server/) which assembles your application and serves it over HTTP:

```console
npm start
```

The empty application can now be opened, by pointing your web browser at [http://localhost:8080/debug.html](http://localhost:8000/debug.html).
Here, you should see an empty document containing nothing but a greeting message, indicating that everything was set up correctly.

To stop the server (for now), press `Ctrl-C`.


## The Next Step

The next step is to create a simple widget and to add it to your application in order to display ["Hello World!"](02_hello_world.md).

Getting Started | [Hello, World! »](02_hello_world.md)
