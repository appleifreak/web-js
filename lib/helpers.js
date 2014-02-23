var Minimatch, isMatch, _;

_ = require("underscore");

Minimatch = require("minimatch").Minimatch;

isMatch = exports.isMatch = function(filename, pattern) {
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

exports.isQueryMatch = function(filename, rules) {
  var rMatch;
  rMatch = function(rule, key) {
    if (_.isObject(rule)) {
      if (key === "$or") {
        return _.any(rule, rMatch);
      } else {
        return _.every(rule, rMatch);
      }
    }
    return isMatch(filename, rule);
  };
  return rMatch(rules);
};
