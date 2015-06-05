/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * www.laxarjs.org
 */
/*global module,__dirname,__filename */
module.exports = function( grunt ) {
   'use strict';

   require( 'load-grunt-tasks' )( grunt );

   var serverPort = 8000;
   var testPort = 1000 + serverPort;
   var liveReloadPort = 30000 + serverPort;

   grunt.initConfig( {
      pkg: grunt.file.readJSON( 'package.json' ),
      connect: {
         options: {
            port: serverPort
         },
         default: {},
         test: {
            options: {
               port: testPort,
               keepalive: false
            }
         },
         keepalive: {
            options: {
               port: serverPort,
               keepalive: true
            }
         }
      },
      jshint: {
         options: {
            jshintrc: __dirname + '/.jshintrc'
         }
      },
      karma: {
         options: {
            reporters: [ 'progress', 'junit' ],
            proxies: {
               '/base': 'http://localhost:' + testPort
            }
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
                  '*.{html,js,json}',
                  'application/**',
                  'bower_components/**',
                  'includes/{controls,lib,themes,widgets}/**',
                  'var/**',
                  '!includes/**/{bower_components,node_modules}/**'
               ],
               filter: 'isFile'
            } ]
         }
      },
      laxar_application_dependencies: {
         default: {
            options: {},
            dest: 'var/static/laxar_application_dependencies.js',
            src: [ 'application/flow/*.json' ]
         }
      },
      css_merger: {
         default: {
            src: [ 'application/flow/*.json' ]
         }
      },
      cssmin: {
         default: {
            options: {
               keepSpecialComments: 0
            },
            files: [ {
               expand: true,
               src: 'var/static/css/*.theme.css',
               ext: '.theme.css'
            } ]
         }
      },
      directory_tree: {
         application: {
            dest: 'var/listing/application_resources.json',
            src: [
               'application/{flow,pages}/**/*.json',
               'application/layouts/**/*.{css,html}'
            ],
            options: {
               embedContents: [
                  'application/{flow,pages}/**/*.json',
                  'application/layouts/**/*.html'
               ]
            }
         },
         bower_components: {
            dest: 'var/listing/bower_components_resources.json',
            src: [
               'bower_components/laxar-uikit/dist/themes/default.theme/css/theme.css',
               'bower_components/laxar-uikit/dist/controls/*/{control.json,*.theme/css/*.css}',
               'bower_components/laxar-*-control/{control.json,*.theme/css/*.css}'
            ],
            options: {
               embedContents: [
                  'bower_components/laxar-uikit/dist/controls/*/control.json'
               ]
            }
         },
         includes: {
            dest: 'var/listing/includes_resources.json',
            src: [
               'includes/themes/*.theme/{css,controls,widgets,layouts}/**/*.{css,html}',
               'includes/controls/*/*/{control.json,*.theme/css/*.css}',
               'includes/widgets/*/*/{widget.json,*.theme/css/*.css,*.theme/*.html}'
            ],
            options: {
               embedContents: [
                  'includes/controls/**/control.json',
                  'includes/widgets/*/*/{widget.json,*.theme/*.html}'
               ]
            }
         }
      },
      concat: {
         build: {
            src: [
               'require_config.js',
               'bower_components/requirejs/require.js'
            ],
            dest: 'var/build/require_configured.js'
         }
      },
      requirejs: {
         default: {
            options: {
               mainConfigFile: 'require_config.js',
               deps: [ '../var/build/require_configured' ],
               name: '../init',
               out: 'var/build/bundle.js',
               optimize: 'uglify2'
            }
         }
      },
      watch: {
         options: {
            livereload: liveReloadPort,
            reload: true
         },
         Gruntfile: {
            files: __filename
         },
         application: {
            files: [
               'application/**/!(scss)/*.*'
            ]
         },
         libraries: {
            files: [
               'includes/lib/*/!(bower_components|node_modules)/**',
               'includes/themes/*.theme/!(bower_components|node_modules)/**',
               '!includes/**/test-results.xml'
            ]
         },
         dependencies: {
            files: [
               '<%= directory_tree.application.src %>',
               '<%= directory_tree.includes.src %>'
            ],
            tasks: [
               'directory_tree:application',
               'directory_tree:includes',
               'laxar_application_dependencies'
            ],
            options: {
               event: [ 'added', 'deleted' ]
            }
         }
      }
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var path = require( 'path' );

   grunt.file.expand( 'includes/widgets/*/*/widget.json' )
      .map( path.dirname )
      .forEach( configureArtifact.bind( null, 'widget' ) );

   grunt.file.expand( 'includes/controls/**/control.json' )
      .map( path.dirname )
      .forEach( configureArtifact.bind( null, 'control' ) );

   function configureArtifact( type, artifact ) {
      var config = grunt.config( type + '.' + artifact ) || {};
      config.karma = config.karma || { junitReporter: { outputFile: artifact + '/test-results.xml' } };
      grunt.config( type + '.' + artifact, config );

      grunt.config( 'watch.' + type + '_' + artifact, {
         files: [
            artifact + '/!(bower_components|node_modules)',
            artifact + '/!(bower_components|node_modules)/**',
            '!' + artifact + '/test-results.xml'
         ]
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerTask( 'server', [ 'connect:default' ] );
   grunt.registerTask( 'build', [ 'directory_tree', 'laxar_application_dependencies' ] );
   grunt.registerTask( 'optimize', [ 'build', 'css_merger', 'cssmin', 'concat', 'requirejs' ] );
   grunt.registerTask( 'test', [ 'connect:test', 'widgets' ] );
   grunt.registerTask( 'dist', [ 'optimize', 'compress' ] );
   grunt.registerTask( 'start', [ 'build', 'server', 'watch' ] );
   grunt.registerTask( 'start-no-watch', [ 'build', 'connect:keepalive' ] );

   grunt.registerTask( 'default', [ 'build', 'test' ] );

};
