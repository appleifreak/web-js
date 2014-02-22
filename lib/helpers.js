var Minimatch, _;

_ = require("underscore");

Minimatch = require("minimatch").Minimatch;

exports.isMatch = function(filename, pattern) {
  if (_.isString(pattern)) {
    pattern = new Minimatch(pattern);
  }
  if (pattern instanceof Minimatch) {
    return pattern.match(filename);
  } else if (_.isRegExp(pattern)) {
    return pattern.test(filename);
  } else {
    return pattern === filename;
  }
};
