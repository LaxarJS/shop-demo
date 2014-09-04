# Getting Started
This tutorial is about how to use LaxarJS to create a large web app. The tutorial provides for a step by step introduction into the techniques to create widgets and activities and how to use them in an application.

## Get the Prerequisites

```
npm install -g grunt-cli grunt-init
git clone https://github.com/LaxarJS/grunt-init-laxar-application.git ~/.grunt-init/laxar-application
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-widget
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-activity
```

## Create a LaxarJS Application from Our Template

```
mkdir shop_demo
cd shop_demo
grunt-init laxar-application
```
The script is asking some details about the application and gives suggestions for possible answers to these questions. If there isn't a service running on localhost on port 8000 we can just accept the suggested answers. Otherwise we have to change the port and write it down for further steps.

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

The script creates the application ShopDemo which has some dependencies. We fetch them with:
```
npm install
```

Now we can start the application with:
```
npm start
```

We visit the empty application at [http://localhost:8000/debug.html](http://localhost:8000/debug.html)

We see an empty site with a page title "LaxarJS ShopDemo".  

To stop the server we press Ctrl-C.

## Next Step
The next step is to create a simple widget and add it to our app to display ["Hello World!"](hello_world.md).  


Getting Started | [Hello World! >>](hello_world.md)  
