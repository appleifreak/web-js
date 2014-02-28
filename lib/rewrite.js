var fs, isMatch, isQueryMatch, path, _, _ref;

_ = require("underscore");

fs = require("fs");

path = require("path");

_ref = require("./helpers"), isMatch = _ref.isMatch, isQueryMatch = _ref.isQueryMatch;

module.exports = function(req, res, next) {
  var dirfiles, ignored, index, parts;
  res.set("X-Powered-By", "WebJS (Express)");
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
    return next();
  }
  if (!isQueryMatch(req.path.substr(1), $conf.get("http.allow"))) {
    return next(new HTTPError(403));
  }
  req.filename = path.join($conf.get("cwd"), req.path);
  if (!fs.existsSync(req.filename)) {
    return next();
  }
  req.stat = fs.statSync(req.filename);
  if (req.stat.isDirectory()) {
    dirfiles = fs.readdirSync(req.filename);
    index = _.find(dirfiles, function(f) {
      return _.some($conf.get("http.index"), function(p) {
        return isMatch(f, p);
      });
    });
    if (index != null) {
      req.filename = path.join(req.filename, index);
      req.stat = fs.statSync(req.filename);
    }
  }
  req.relative = path.relative($conf.get("cwd"), req.filename);
  return next();
};
