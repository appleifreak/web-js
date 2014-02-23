var fs, isMatch, path, _;

_ = require("underscore");

fs = require("fs");

path = require("path");

isMatch = require("./helpers").isMatch;

module.exports = function(req, res, next) {
  var dirfiles, ignored, index, parts;
  parts = req.path.split("/");
  ignored = _.some(parts, function(part, i) {
    if (i + 1 !== parts.length) {
      part = part + "/";
    }
    return _.some($conf.get("http.ignore"), function(p) {
      return isMatch(part, p);
    });
  });
  if (ignored) {
    return next(new HTTPError(404, "Not Found."));
  }
  req.filename = path.join(process.cwd(), req.path);
  if (!fs.existsSync(req.filename)) {
    return next();
  }
  if (fs.statSync(req.filename).isDirectory()) {
    dirfiles = fs.readdirSync(req.filename);
    index = _.find(dirfiles, function(f) {
      return _.some($conf.get("http.index"), function(p) {
        return isMatch(f, p);
      });
    });
    if (index == null) {
      return next();
    }
    req.filename = path.join(req.filename, index);
  }
  return next();
};
