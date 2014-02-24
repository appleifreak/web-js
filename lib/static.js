var directory, express, fs, isQueryMatch, path, _;

_ = require("underscore");

fs = require('fs');

path = require('path');

express = require("express");

isQueryMatch = require("./helpers").isQueryMatch;

directory = express.directory(process.cwd());

module.exports = function(req, res, next) {
  var ext, patterns, relative, type, _ref, _ref1;
  if (req.filename == null) {
    return next();
  }
  relative = path.relative(process.cwd(), req.filename);
  patterns = (_ref = $conf.get("static.patterns")) != null ? _ref : [];
  if (!isQueryMatch(relative, patterns)) {
    return next();
  }
  if (req.stat.isDirectory() && $conf.get("static.directory")) {
    return directory.apply(this, arguments);
  }
  ext = path.extname(req.filename);
  type = _.find((_ref1 = $conf.get("static.mimetypes")) != null ? _ref1 : [], function(m, e) {
    return ext === m;
  });
  if (type == null) {
    type = ext;
  }
  res.type(type);
  return fs.createReadStream(req.filename).pipe(res);
};
