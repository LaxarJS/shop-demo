# Getting Started
This tutorial explains how to create simple shopping web application with LaxarJS.
It provides a step by step introduction into creating widgets and activities and using them in an application.
It is intended for programmers who are familiar with [*AngularJS*](https://angularjs.org/) and the related web technologies.
Basic knowledge of *git* is assumed as well.

## Get the Prerequisites
First, we install the *grunt* command-line interface and the *grunt-init* scaffolding tool.
Depending on the system we have to do this using sudo or using an administrator shell.

```shell
npm install -g grunt-cli grunt-init
```

Now we get the LaxarJS templates which we will instantiate using `grunt-init` to create based structures of our application and artifacts:
```shell
git clone https://github.com/LaxarJS/grunt-init-laxar-application.git ~/.grunt-init/laxar-application
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-widget
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-activity
```

## Creating a LaxarJS Application from the Template

```shell
mkdir shop_demo
cd shop_demo
grunt-init laxar-application
```
The script will ask us some details about the application and offers suggestions for possible answers to these questions.
It creates the base files and directory structure of a LaxarJS application.
If currently there is no service running on localhost on port 8000 we can just accept the suggested answers.
Otherwise we have to change the port and write it down for further steps.

```
Please answer the following:
[?] Application name (shop_demo)
[?] Application title (LaxarJS ShopDemo)
[?] Description (My new LaxarJS application) A demo app to show how LaxarJS works.
[?] Licenses (none) MIT
[?] Project homepage (none) www.laxarjs.org
[?] Author name (author) LaxarJS
[?] Version (0.1.0)
[?] LaxarJS version (0.x)
[?] Development server port (8000)
[?] Do you need to make any changes to the above before continuing? (y/N)
```

The script creates the application ShopDemo which has some dependencies to LaxarJS and third party libraries.
We fetch these using:
```shell
npm install
```

Now we can start the application:
```shell
npm start
```

The empty application can now be visited at [http://localhost:8000/debug.html](http://localhost:8000/debug.html).
If we used a different port we have to change the port in the url.

We see an empty site with the page title "LaxarJS ShopDemo".

To stop the server we press `Ctrl-C`.

## The Next Step
The next step is to create a simple widget and add it to our application in order to display ["Hello World!"](02_hello_world.md).


Getting Started | [Hello World! »](02_hello_world.md)
