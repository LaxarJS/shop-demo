/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */
/*global module,__dirname,__filename */
module.exports = function( grunt ) {
   'use strict';

   var serverPort = 15001;
   var testPort = 1000 + serverPort;
   var liveReloadPort = 30000 + serverPort;

      grunt.initConfig( {
         pkg: grunt.file.readJSON( 'package.json' ),

         'laxar-configure': {
            options: {
               flows: [
                  { target: 'main', src: 'application/flow/flow.json' }
               ],
               ports: {
                  develop: serverPort,
                  test: testPort,
                  livereload: liveReloadPort
               },
               userTasks: {
                  'build-flow': [ 'laxar-compass-flow' ]
               }
            }
         },
         babel: {
            options: {
               sourceMap: 'inline',
               modules: 'amd',
               retainLines: true
            },
            widgets: {
               files: [ {
                  expand: true,
                  cwd: 'includes/widgets/',
                  src: [ '*/*.jsx' ],
                  dest: 'includes/widgets/',
                  ext: '.js'
               } ]
            }
         },
         // Hack to circumvent grunt-laxar jshint validation for generated files.
         // Unfortunately, babel-generated comments are not placed at the very start of the file.
         concat: {
            babel: {
               options: {
                  banner: '/* jshint ignore:start */\n'
               },
               files: [ {
                  expand: true,
                  cwd: 'includes/widgets/page-inspector-widget',
                  src: [ '*.js' ],
                  dest: 'includes/widgets/page-inspector-widget',
                  ext: '.js'
               } ]
            }
         },
         watch: {
            jsx: {
               files: [ 'includes/widgets/*/*.jsx' ],
               tasks: [ 'babel:widgets', 'concat:babel' ]
            }
         }

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.loadNpmTasks( 'grunt-laxar' );
   grunt.loadNpmTasks( 'grunt-laxar-compass' );
   grunt.loadNpmTasks( 'grunt-babel' );
   grunt.loadNpmTasks( 'grunt-contrib-concat' );

   // basic aliases
   grunt.registerTask( 'prepare', [ 'babel', 'concat' ] );
   grunt.registerTask( 'test', [ 'prepare', 'laxar-test' ] );
   grunt.registerTask( 'build', [ 'prepare', 'laxar-build' ] );
   grunt.registerTask( 'dist', [ 'prepare', 'laxar-dist' ] );
   grunt.registerTask( 'develop', [ 'prepare', 'laxar-develop' ] );
   grunt.registerTask( 'info', [ 'laxar-info' ] );

   // additional (possibly) more intuitive aliases
   grunt.registerTask( 'optimize', [ 'prepare', 'laxar-dist' ] );
   grunt.registerTask( 'start', [ 'develop' ] );

   grunt.registerTask( 'default', [ 'build', 'test' ] );

};
