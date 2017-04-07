//'use strict';
var BaseReporter = require("testarmada-magellan").Reporter;
var util = require("util");

var Reporter = function () {
};

util.inherits(Reporter, BaseReporter);

Reporter.prototype.listenTo = function (testRun, test, source) {
  // Stream stdout and stderr directly to stdout, assuming this source is
  // a process that has those properties.
  if (source.stdout) {
    source.stdout.pipe(process.stdout);
  }
  if (source.stderr) {
    source.stderr.pipe(process.stderr);
  }
};

module.exports = Reporter;
