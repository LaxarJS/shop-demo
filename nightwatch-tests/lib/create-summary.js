// This script names the magellan reports correctly for jenkins display.
'use strict';

const fs = require( 'fs' );
const DOMParser = require( 'xmldom' ).DOMParser;
const XMLSerializer = require( 'xmldom' ).XMLSerializer;
const path = require( 'path' );

const reportDir = process.env.REPORT_DIR ? process.env.REPORT_DIR : './reports/';

readFiles( reportDir );

function readFiles( dirname ) {
   fs.readdir( dirname, ( err, filenames ) => {
      const filenamesXML = filenames.filter( isXML );
      let testResults;
      filenamesXML.forEach( filename => {
         const data = fs.readFileSync( dirname + filename, 'utf-8');
         const doc = new DOMParser().parseFromString( data );
         doc.documentElement.getElementsByTagName( 'testsuite' )[ 0 ].setAttribute(
            'package',
            `Nightwatch.${path.basename( filename, '.xml' )}`
         );
         doc.documentElement.getElementsByTagName( 'testsuite' )[ 0 ].setAttribute(
            'name',
            `Nightwatch.${path.basename( filename, '.xml' )}`
         );
         for( let i = 0; i < doc.documentElement.getElementsByTagName( 'testcase' ).length; i++ ) {
            doc.documentElement.getElementsByTagName( 'testcase' )[ i ].setAttribute(
               'classname',
               `Nightwatch.${path.basename( 'Test.Selenium-Tests', '.xml' )}`
            );
            doc.documentElement.getElementsByTagName( 'testcase' )[ i ].setAttribute(
               'name',
               `${path.basename( filename, '.xml' )}.
                  ${doc.documentElement.getElementsByTagName( 'testcase' )[ i ].getAttribute( 'name' )}`
            );
         }
         if( testResults ) {
            const errors = Number( testResults.documentElement.getAttribute( 'errors' ) ) +
                  Number( doc.documentElement.getAttribute( 'errors' ) );
            const failures = Number( testResults.documentElement.getAttribute( 'failures' ) ) +
                  Number( doc.documentElement.getAttribute( 'failures' ) );
            const tests = Number( testResults.documentElement.getAttribute( 'tests' ) ) +
                  Number( doc.documentElement.getAttribute( 'tests' ) );
            testResults.documentElement.setAttribute( 'errors', errors );
            testResults.documentElement.setAttribute( 'failures', failures );
            testResults.documentElement.setAttribute( 'tests', tests );
            testResults.documentElement.appendChild( doc.getElementsByTagName( 'testsuite' )[ 0 ] );
         }
         else {
            testResults = doc;
         }
         fs.unlinkSync( dirname + filename );
      } );
      let output = new XMLSerializer().serializeToString( testResults );
      output = output.replace( /^\s*[\r\n]/gm, '' );
      fs.writeFileSync( dirname + 'TEST.xml', output );
   } );
}

function isXML( file ) {
   if( path.extname( file ) === '.xml' ){
      return true;
   }
   return false;
}
