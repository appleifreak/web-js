var Minimatch, config, core, createContext, createNewModuleContext, express, fs, isMatch, transform, transformers, validFiles, _, _ref,
  __slice = [].slice;

_ = require("underscore");

express = require("express");

fs = require("fs");

Minimatch = require("minimatch").Minimatch;

isMatch = require("./helpers").isMatch;

createNewModuleContext = require("./module");

config = $conf.get("sandbox");

transformers = [];

validFiles = (_ref = config.patterns) != null ? _ref : [];

_.each(config.transformers, function(options, name) {
  var api, trans;
  if (!_.isObject(options)) {
    options = {};
  }
  trans = {
    name: name,
    patterns: []
  };
  api = {
    registerPattern: function() {
      var matches;
      matches = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _.each(_.flatten(matches), function(m) {
        if (_.isString(m)) {
          m = new Minimatch(m);
        }
        trans.patterns.push(m);
        return validFiles.push(m);
      });
    },
    registerExtension: function() {
      var exts;
      exts = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _.each(_.flatten(exts), function(ext) {
        if (ext[0] !== ".") {
          ext = "." + ext;
        }
        return api.registerPattern("**/*" + ext);
      });
    }
  };
  trans.fn = require("./transformers/" + name)(api, options);
  return transformers.push(trans);
});

transform = function(filename, source) {
  var trans;
  trans = _.find(transformers, function(t) {
    return _.some(t.patterns, function(p) {
      return isMatch(filename, p);
    });
  });
  if (trans != null) {
    return trans.fn(source);
  } else {
    return source;
  }
};

createContext = function(filepath, sandbox) {
  var modctx;
  _.extend(sandbox, {
    __createContext: createContext,
    console: console,
    process: process,
    Buffer: Buffer,
    $conf: $conf,
    root: root,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
  });
  sandbox.global = sandbox;
  modctx = createNewModuleContext(filepath, sandbox);
  modctx.runMain();
  return modctx;
};

core = express();

core.use(function(req, res, next) {
  var dirfiles, filepath, index;
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
  if (!_.some(validFiles, function(p) {
    return isMatch(filepath, p);
  })) {
    return next();
  }
  return createContext(filepath, {
    $req: req,
    $res: res,
    $next: next
  });
});

core.use(express.directory(process.cwd()));

core.use(express["static"](process.cwd()));

module.exports = core;
