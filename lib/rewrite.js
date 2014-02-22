var ignore, isMatch, _;

_ = require("underscore");

isMatch = require("./helpers").isMatch;

ignore = $conf.get("http.ignore");

module.exports = function(req, res, next) {
  var ignored, parts;
  parts = req.path.split("/");
  ignored = _.some(parts, function(part, i) {
    if (i + 1 !== parts.length) {
      part = part + "/";
    }
    return _.some(ignore, function(p) {
      return isMatch(part, p);
    });
  });
  if (ignored) {
    return next(new HTTPError(404, "Not Found."));
  } else {
    return next();
  }
};
