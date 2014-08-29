# LaxarJS

## Getting Started

This is a very minimal getting started guide. It helps you to set up your first LaxarJS application and to create your first LaxarJS widget.


### Get the Prerequisites

```sh
npm install -g grunt-cli grunt-init
git clone https://github.com/LaxarJS/grunt-init-laxar-application.git ~/.grunt-init/laxar-application
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-widget
git clone https://github.com/LaxarJS/grunt-init-laxar-widget.git ~/.grunt-init/laxar-activity
```

### Create a LaxarJS Application from Our Template

```sh
mkdir tryout
cd tryout
grunt-init laxar-application
npm install
npm start
```
Visit your empty application at [http://localhost:8000/debug.html](http://localhost:8000/debug.html)
Press Ctrl-c to stop the server for now.


### Create your first LaxarJS widget

Create a widget which just displays _Hello, world!_
```sh
mkdir -p includes/widgets/tryout/my_first_widget
cd includes/widgets/tryout/my_first_widget
grunt-init laxar-widget
add some widget-HTML:
echo '<h1>Hello, world!</h1>' > default.theme/my_first_widget.html
```

Reference the widget from your page:
```sh
cd -
echo '{
   "layout": "one_column",
   "areas": {
      "activities": [ ],
      "header": [ ],
      "content": [
          {
             "widget": "tryout/my_first_widget"
          }
      ],
      "footer": [ ]
   }
}
' > application/pages/page1.json
npm start
```
See your widget in action at [http://localhost:8000/debug.html](http://localhost:8000/debug.html)


### Create a Compressed Release-Ready Version of Your Application
First, stop the development server using Ctrl-c.
```sh
grunt dist
npm start
```
Now your compressed application can be visited at [http://localhost:8000/](http://localhost:8000/) or deployed from the zip file that was just generated for you.

#### Next Steps
Have fun developing your first LaxarJS application.

Make sure to have a look at the [API doc](docs/api/index.md) and stay tuned for the upcoming getting started guide.

