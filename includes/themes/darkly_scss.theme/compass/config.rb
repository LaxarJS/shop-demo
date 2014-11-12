# Sets the number of digits of precision
# For example, if this is 3,
# 3.1415926 will be printed as 3.142
# Bootstrap needs a precision of ten!
Sass::Script::Number.precision=10



# Import Path
# -----------

# Variable
base_dir = File.dirname(__FILE__) + '/../'

# Assume that we are installed under includes/themes:
bower_dir = base_dir + '../../../bower_components/'

# Find SCSS in theme (from widgets, controls and layouts)
add_import_path base_dir + 'scss/'
# Find UIKit SCSS
add_import_path bower_dir + 'laxar_uikit/scss/'

# Find Third party SCSS
# - Bootstrap
add_import_path bower_dir + 'bootstrap-sass-official/assets/stylesheets/'
# - Font Awesome (use bower_components directory so that imports have a prefix)
add_import_path bower_dir



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
