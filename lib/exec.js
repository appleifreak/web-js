var cluster, config, fs, isMatch, _;

_ = require("underscore");

cluster = require("cluster");

fs = require("fs");

isMatch = require("./helpers").isMatch;

config = $conf.get("sandbox");

module.exports = function(req, res, next) {
  var $req, dirfiles, env, filepath, index, worker;
  filepath = process.cwd() + req.path;
  if (!fs.existsSync(filepath)) {
    return next();
  }
  if (fs.statSync(filepath).isDirectory()) {
    dirfiles = fs.readdirSync(filepath);
    index = _.find(dirfiles, function(f) {
      return _.some(config.index, function(p) {
        return isMatch(f, p);
      });
    });
    if (index == null) {
      return next();
    }
    filepath += index;
  }
  if (!_.some(config.patterns, function(p) {
    return isMatch(filepath, p);
  })) {
    return next();
  }
  $req = _.pick(req, "query", "method", "url", "headers", "ip", "body", "path");
  env = _.chain({
    main: filepath,
    request: $req,
    config: $conf.get()
  }).map(function(v, k) {
    return ["X_" + (k.toUpperCase()), JSON.stringify(v)];
  }).object().value();
  worker = cluster.fork(env);
  worker.on("message", function(msg) {
    if (_.isObject(msg) && (msg.type != null)) {
      switch (msg.type) {
        case "header":
          return res.set(msg.key, msg.value);
      }
    } else if (!_.isEmpty(msg)) {
      return res.write(msg);
    } else {
      return res.end();
    }
  });
  return worker.on("exit", function() {
    return res.end();
  });
};
