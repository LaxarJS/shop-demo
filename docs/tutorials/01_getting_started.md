# Getting Started

This tutorial explains how to create a simple web-based shopping application using [LaxarJS](http://laxarjs.org).
It provides a step-by-step introduction into creating widgets and activities and using them in an application.
It is intended for programmers who are familiar with [*AngularJS*](https://angularjs.org/) and the related web technologies.
Rudimentary knowledge of *git* is assumed as well.
If you are unfamiliar with LaxarJS, you might want to check out [Why LaxarJS](https://github.com/LaxarJS/laxar/blob/master/docs/why_laxar.md) and maybe have a brief look at the [key concepts](https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md) first.


## Get the Prerequisites

First, we install the *grunt* command-line interface and the *grunt-init* scaffolding tool.
Depending on the system we have to do this using `sudo` or from an administrative shell.

```shell
npm install -g grunt-cli grunt-init
```

Now we can obtain the LaxarJS templates which we will instantiate using `grunt-init` to get started with our application and artifacts:

```shell
git clone https://github.com/LaxarJS/grunt-init-laxar-application.git ~/.grunt-init/laxar-application
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-widget
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-activity
```

**Note for Windows users:** Instead of the `~`, you have to use `%USERPROFILE%` to reference your home directory.


## Creating a LaxarJS Application from the Template

```shell
mkdir shop-demo
cd shop-demo
grunt-init laxar-application
```

The script will ask for some details about the application and offer suggestions for possible answers to these questions.
It creates the basic file- and directory structure of a LaxarJS application.
If there is no service currently running on port 8000 we can just accept the suggested answer.
Otherwise, we need to make sure to remember to port we choose, and use it to access the application later on.

```
Please answer the following:
[?] Application name (shop-demo)
[?] Application title (ShopDemo) LaxarJS ShopDemo
[?] Description (My new LaxarJS application) A demo application to learn how LaxarJS works.
[?] Licenses (none) MIT
[?] Project homepage (none) http://www.laxarjs.org
[?] Author name (author) LaxarJS
[?] Version (0.1.0-pre)
[?] Development server port (8000)
[?] Should a set of example widgets be generated? (Y/n) no
[?] Do you need to make any changes to the above before continuing? (y/N)
```

The script creates the application _ShopDemo_ with the necessary dependencies to LaxarJS.

First, we set up the development server and fetch the dependencies:
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
