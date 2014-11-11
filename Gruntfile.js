/**
 * Copyright 2014 Jonas Schulte
 * Released under the MIT license.
 * www.laxarjs.org
 */
/*global module,__dirname,__filename */
module.exports = function( grunt ) {
   'use strict';

   var path = require( 'path' );
   var _ = grunt.util._;

   var serverPort = 8000;
   var liveReloadPort = 30000 + serverPort;

   grunt.initConfig( {
      pkg: grunt.file.readJSON( 'package.json' ),
      connect: {
         options: {
            port: serverPort
         },
         default: {}
      },
      jshint: {
         options: {
            jshintrc: __dirname + '/.jshintrc'
         }
      },
      compress: {
         default: {
            options: {
               archive: '<%= pkg.name %>-<%= pkg.version %>.zip',
               mode: 'zip'
            },
            files: [ {
               src: [
                  '*.+(css|html|js|json)',
                  'application/**',
                  'bower_components/**',
                  'includes/+(controls|lib|themes|widgets)/**',
                  'static/**',
                  'var/**',
                  '!includes/**/+(bower_components|node_modules)/**'
               ],
               filter: 'isFile'
            } ]
         }
      },
      portal_angular_dependencies: {
         default: {
            options: {},
            dest: 'var/static/portal_angular_dependencies.js',
            src: [ 'application/flow/*.json' ]
         }
      },
      css_merger: {
         default: {
            src: [ 'application/flow/*.json' ]
         }
      },
      widget_json_merger: { default: {} },
      directory_tree: {
         layouts: {
            dest: 'var/listing/application_layouts.json',
            src: [
               'application/layouts/**/*.+(css|html)'
            ],
            options: {
               embedContents: [
                  'application/layouts/**/*.+(css|html)'
               ]
            }
         },
         pages: {
            dest: 'var/listing/application_pages.json',
            src: [
               'application/pages/**/*.json'
            ],
            options: {
               embedContents: [
                  '**/*.*'
               ]
            }
         },
         themes: {
            dest: 'var/listing/includes_themes.json',
            src: [
               'includes/themes/**/*.+(css|html)'
            ],
            options: {
               embedContents: [
                  'includes/themes/**/controls/**/*.+(css|html)'
               ]
            }
         },
         uikit: {
            dest: 'var/listing/laxar_uikit.json',
            src: [
               'includes/lib/laxar_uikit/themes/**/*.css',
               'includes/lib/laxar_uikit/controls/**/*.+(css|html)'
            ],
            embedContents: [ 'includes/lib/laxar_uikit/controls/**/*.html' ]
         },
         widgets: {
            dest: 'var/listing/includes_widgets.json',
            src: [
               'includes/widgets/*/*/*.+(css|html|json)',
               '!includes/widgets/*/*/+(package|bower).json',
               'includes/widgets/*/*/!(bower_components|node_modules|spec)/**/*.+(css|html|json)'
            ],
            options: {
               embedContents: [
                  'includes/widgets/*/*/widget.json',
                  'includes/widgets/*/*/*.theme/*.html',
                  'includes/widgets/*/*/*.theme/css/*.css'
               ]
            }
         }
      },
      requirejs: {
         default: {
            options: {
               mainConfigFile: 'require_config.js',
               name: '../init',
               out: 'var/build/optimized_init.js',
               optimize: 'uglify2'
            }
         }
      },
      watch: {
         options:  {
            livereload: liveReloadPort
         },
         Gruntfile: {
            files: __filename,
            options: {
               /* reload Grunt config */
               reload: true
            }
         },
         layouts: {
            files: [ '<%= directory_tree.layouts.src %>' ],
            tasks: [ 'directory_tree:layouts' ],
            options: {
               event: [ 'added', 'deleted' ]
            }
         },
         themes: {
            files: [ '<%= directory_tree.themes.src %>' ],
            tasks: [ 'directory_tree:themes' ],
            options: {
               event: [ 'added', 'deleted' ]
            }
         },
         widgets: {
            files: [ '<%= directory_tree.widgets.src %>', 'includes/widgets/*' ],
            tasks: [ 'directory_tree:widgets' ],
            options: {
               reload: true
            }
         }
      }
   } );

   /* Find all widget.json files,
    * take their directory names,
    * create or update the configuration */
   grunt.file.expand( 'includes/widgets/*/*/widget.json' )
             .map( path.dirname )
             .forEach( function( widget ) {
      var config = grunt.config( 'widget.' + widget );
      grunt.config( 'widget.' + widget, _.defaults( {}, config ) );
      grunt.config( 'watch.' + widget, {
         files: [ widget + '/!(bower_components|node_modules)',
                  widget + '/!(bower_components|node_modules)/**' ]/*,
         tasks: [ 'widget:' + widget ]*/
      } );
   } );

   grunt.loadNpmTasks( 'grunt-laxar' );
   grunt.loadNpmTasks( 'grunt-contrib-compass' );
   grunt.loadNpmTasks( 'grunt-contrib-compress' );
   grunt.loadNpmTasks( 'grunt-contrib-watch' );

   grunt.registerTask( 'server', [ 'connect' ] );
   grunt.registerTask( 'build', [ 'directory_tree', 'portal_angular_dependencies' ] );
   grunt.registerTask( 'optimize', [ 'widget_json_merger', 'css_merger', 'requirejs' ] );
   grunt.registerTask( 'test', [ 'server', 'widgets' ] );
   grunt.registerTask( 'default', [ 'build', 'test' ] );
   grunt.registerTask( 'dist', [ 'build', 'optimize' ] );
   grunt.registerTask( 'start', [ 'build', 'server', 'watch' ] );
};
