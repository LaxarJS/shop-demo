# Global compass configuration for the default.theme
# -----
require 'autoprefixer-rails'

# Sets the number of digits of precision
# For example, if this is 3,
# 3.1415926 will be printed as 3.142
# Bootstrap needs a precision of ten!
Sass::Script::Number.precision=10


# Added post-compile hook for autorpefxier
# ----------------------------------------

# Set support to specific browsers: ['ie 8', 'ie 7']
# Set support to only browsers that have certain market share: ['> 5%']
# Set support to the last n versions of browsers: ['latest 2 versions']

# > n% is browser versions, selected by global usage statistics.
# ff > 20 and ff >= 20 is Firefox versions newer, that 20.
# none don’t set any browsers to clean CSS from any vendor prefixes.

# android for old Android stock browser.
# bb for Blackberry browser.
# chrome for Google Chrome.
# ff for Mozilla Firefox.
# ie for Internet Explorer.
# ios for iOS Safari.
# opera for Opera.
# safari for desktop Safari.

browsers = ["ff >= 10", "chrome >= 10", "ie >= 9"]

on_stylesheet_saved do |file|
   css = File.read(file)
   File.open(file, 'w') { |io| io << AutoprefixerRails.compile(css, browsers) }
end



# Import Path
# -----------

# Variable
base_dir = File.dirname(__FILE__) + '/../'

# Bower: Assume that we are installed as a bower component:
bower_dir = base_dir + '../'
# Respect theme-local bower installation if there ist one:
if File.directory? (base_dir + 'bower_components/')
   bower_dir = base_dir + 'bower_components/'
end

# UiKit: Assume that we are installed as a bower component:
uikit_dir = bower_dir + 'laxar_uikit/'
# Look for UiKit installed as a submodule in the application:
if File.directory? (base_dir + '../../lib/laxar_uikit/')
   uikit_dir = base_dir + '../../lib/laxar_uikit/'
   # Allow to import controls using 'laxar_uikit/controls/...'
   add_import_path base_dir + '../../lib/'
end

# Look for UiKitCustomization installed as a submodule in the application:
if File.directory? (base_dir + '../../lib/laxar_uikit_customization/')
   uikit_customization_dir = base_dir + '../../lib/laxar_uikit_customization/'
end

# Widgets: Assume that we are installed as a bower component:
widget_dir = bower_dir + '../includes/widgets'
# Find widgets if this theme is installed as a submodule:
if File.directory? (base_dir + '../../widgets')
   widget_dir = base_dir + '../../widgets'
end

# Find widgets if this theme is installed as a submodule:
if File.directory? (base_dir + '../../../application/layouts')
   layout_dir = base_dir + '../../../application/layouts'
end

# Find SCSS in theme (from widgets, controls and layouts)
add_import_path base_dir + 'scss/'

# Find UIKit SCSS
add_import_path uikit_dir + 'scss/'

# Find UIKitCustomization SCSS
add_import_path uikit_customization_dir + 'scss/'

# Find Third party SCSS
## - Bootstrap
add_import_path bower_dir + 'bootstrap-sass-official/vendor/assets/stylesheets/'

## - Font Awesome, Laxar-Uikit controls
add_import_path bower_dir

# Find default theme for widgets
add_import_path widget_dir

# Find default theme for layouts
add_import_path layout_dir



# Project directories
# -------------------

# Sass/Scss Directory
sass_dir = "scss"

# Image Directory For Sprites
sprite_load_path = ["."]



# Output
# ------

css_dir = "css"
images_dir = "images"
fonts_dir = "fonts"

# Indicates whether the compass helper functions should generate relative urls from the generated css to assets, or absolute urls using the http path for that asset type.
relative_assets = true

# CSS Output Style
# You can select your preferred output style here (can be overridden via the command line):
# output_style = :expanded or :nested or :compact or :compressed
output_style = :expanded

# To disable debugging comments that display the original location of your selectors. Uncomment:
line_comments = false
