var crypto, fresh, fs, isMatch, isQueryMatch, md5, path, _, _ref;

_ = require("underscore");

fs = require("fs");

path = require("path");

_ref = require("./helpers"), isMatch = _ref.isMatch, isQueryMatch = _ref.isQueryMatch;

crypto = require("crypto");

fresh = require("fresh");

md5 = function(v) {
  return crypto.createHash("md5").update(v).digest("hex");
};

module.exports = function(req, res, next) {
  var dirfiles, id, ignored, index, parts;
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
  if (!isQueryMatch(req.path, $conf.get("http.allow"))) {
    return next(new HTTPError(403));
  }
  req.filename = path.join(process.cwd(), req.path);
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
  req.relative = path.relative(process.cwd(), req.filename);
  id = md5(req.method + req.url + req.stat.mtime + req.stat.size);
  res.set('ETag', id);
  if (fresh(req.headers, res._headers)) {
    res.writeHead(304);
    res.end();
    return;
  }
  return next();
};
