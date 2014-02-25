var directory, express, fs, isQueryMatch, path, _;

_ = require("underscore");

fs = require('fs');

path = require('path');

express = require("express");

isQueryMatch = require("./helpers").isQueryMatch;

directory = express.directory(process.cwd());

module.exports = function(req, res, next) {
  var allow, ext, type, _ref, _ref1;
  if (req.relative == null) {
    return next();
  }
  allow = (_ref = $conf.get("static.allow")) != null ? _ref : [];
  if (!isQueryMatch(req.relative, allow)) {
    return next();
  }
  if (req.stat.isDirectory() && $conf.get("static.directory")) {
    return directory.apply(this, arguments);
  }
  ext = path.extname(req.filename);
  type = _.find((_ref1 = $conf.get("static.mime_types")) != null ? _ref1 : [], function(m, e) {
    return ext === m;
  });
  if (type == null) {
    type = ext;
  }
  res.type(type);
  return fs.createReadStream(req.filename).pipe(res);
};