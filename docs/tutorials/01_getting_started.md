# Getting Started

This tutorial explains how to create a simple web-based shopping application using [LaxarJS](http://laxarjs.org).
It provides a step-by-step introduction into creating widgets and activities and using them in an application.
It is intended for programmers who are familiar with [*AngularJS*](https://angularjs.org/) and the related web technologies.
Rudimentary knowledge of *git* is assumed as well.
If you are unfamiliar with LaxarJS, you might want to check out [Why LaxarJS](https://github.com/LaxarJS/laxar/blob/master/docs/why_laxar.md) and maybe have a brief look at the [key concepts](https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md) first.


## Get the Prerequisites

First, we install the *grunt* command-line interface and the *Yeoman* scaffolding tool.
Depending on the system, we have to do this using `sudo` or from an administrative shell.

```shell
npm install -g grunt-cli yo
```

Now we can obtain the LaxarJS templates which we will instantiate using `yo`, to get started with our application and artifacts:

```shell
npm install -g generator-laxarjs
```

If you don't have root access to your system, take a look to the section ["local installation" of the LaxarJS generator.](https://github.com/LaxarJS/generator-laxarjs#local-installation)


## Creating a LaxarJS Application from the Template

```shell
mkdir shop-demo
cd shop-demo
yo laxarjs
```

The script will ask for some details about the application and offer suggestions for possible answers to these questions.
It creates the basic file- and directory structure of a LaxarJS application.
If there is no service currently running on port 8000 we can just accept the suggested answer.
Otherwise, we need to make sure to remember to port we choose, and use it to access the application later on.

Answer the following questions of LaxarJS generator:
```
? The application name: (shop-demo)
? Description (optional): A demo application to learn how LaxarJS works
? Licenses: MIT
? Project homepage (optional): http://www.laxarjs.org
? Author name (optional): LaxarJS
? Development server port: 8000
? Should a set of example widgets be generated? No
```

The script creates the application _shop-demo_ with the necessary dependencies to LaxarJS.

First, we install the grunt-tools for LaxarJS, including the development server and its dependencies:
```shell
npm install
```

Now we can start the development server to access our application from a web browser:
```shell
npm start
```

The empty application can now be visited at [http://localhost:8000/debug.html](http://localhost:8000/debug.html).
Here we see an empty document containing nothing but a greeting message to inform us that everything was set up correctly.

To stop the server for now, we press `Ctrl-C`.


## The Next Step

The next step is to create a simple widget and add it to our application in order to display ["Hello World!"](02_hello_world.md).

Getting Started | [Hello, World! »](02_hello_world.md)
