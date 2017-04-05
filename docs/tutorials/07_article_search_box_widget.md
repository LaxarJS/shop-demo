# The article-search-box-widget

We already have a working application with articles provided by the _dummy-articles-activity_, an _article-browser-widget_ to choose items from, an _article-teaser-widget_ for preview, and a _shopping-cart-widget_ to review and submit our order.
At this point, you might call it a day and skip right to the [final step](08_final_steps.md).

However, there is one more feature you might want to implement:
Filtering the list of available articles using a text input.
To this end, this steps illustrates how to create an _article-search-box-widget_ which intercepts and filters the list of articles, _without touching any of the other widgets._


## Creating the article-search-box-widget

This is what the _article-search-box-widget_ will look like:

![article-search-box-widget](img/article_search_box_widget.png)

The widget contains a simple input field and a submit button, and allows the user to filter a list of articles.

As before create the widget with the generator, picking `"vue"` as the integration technology:

```console
yo laxarjs:widget article-search-box-widget
```

### Implementing the Widget Features

The _article-search-box-widget_ subscribes to a resource containing incoming *articles* and publishes a resource containing *filteredArticles* that match a user-specified search term.
Accordingly, we require the configuration of two resource topics in the [widget descriptor](../../application/widgets/article-search-box-widget/widget.json), using the _inlet_ role for the _articles_ resource, and the _outlet_ role for the _filteredArticles_ resource.
If no filter term has been entered by the user, the incoming articles are simply passed through in their entirety.

Let us start with the _template_ of the widget component [article-search-box-widget.vue](../../application/widgets/article-search-box-widget/article-search-box-widget.vue):

```vue
<form role="form" @submit="search()">
   <div class="form-group">
      <div class="input-group">
         <input class="form-control"
            type="text"
            placeholder="Search for articles"
            v-model="searchTerm">
         <span class="input-group-btn">
            <button class="btn btn-default" type="submit"><i class="fa fa-search"></i></button>
         </span>
      </div>
   </div>
</form>
```

This time, the `v-model` directive is used for bi-directional synchronization of the `searchTerm` property of the component data, and its DOM representation.
The actual filtering is triggered by the `@submit` event handler.
The widget controller looks like this:

*TODO*

```vue

```


### Styling the Widget

As before, you may want to create an SCSS stylesheet to improve the appearance of the widget, while adding the appropriate CSS classes in the template.

  - [full widget descriptor](../../application/widgets/article-search-box-widget/widget.json), including `styleSource` attribute for SCSS support
  - [full .vue-component](../../application/widgets/article-search-box-widget/shopping-cart-widget.vue), with additional classes inserted
  - [full SCSS stylesheet](../../application/widgets/article-search-box-widget/default.theme/scss/article-search-box-widget.scss)

Now, all that is left is adding the widget to your page definition.


## Adding the Widget to the Page

To display the search box above the other widgets, let us add another widget area to the _three-colums_ layout:

```html
<div class="container">
   <div class="row">
      <div class="col col-md-12" data-ax-widget-area="searchBox"></div>
   </div>
   <div class="row">
      <div class="col col-md-4" data-ax-widget-area="contentA"></div>
      <div class="col col-md-4" data-ax-widget-area="contentB"></div>
      <div class="col col-md-4" data-ax-widget-area="contentC"></div>
   </div>
</div>
```

Finally, we include the _article-search-box-widget_ into our [home](../../application/pages/home.json) page:

```json
"searchBox": [
   {
      "widget": "article-search-box-widget",
      "features": {
         "articles": {
            "resource": "articles"
         },
         "filteredArticles": {
            "resource": "filteredArticles"
         }
      }
   }
]
```

For the filtering to work, you just need to change the `articles.resource` of the _article-browser-widget_ to use the `"filteredArticles"` topic.


## The Next Step

[« Defining the Application Flow](06_application_flow.md) | The article-browser-widget | [Final Steps »](08_final_steps.md)
