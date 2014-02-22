var Minimatch, config, core, coreModules, createContext, express, fs, isMatch, path, resolve, transform, transformers, validFiles, vm, _, _ref,
  __slice = [].slice;

_ = require("underscore");

express = require("express");

path = require("path");

fs = require("fs");

vm = require("vm");

Minimatch = require("minimatch").Minimatch;

isMatch = require("./helpers").isMatch;

config = $conf.get("sandbox");

coreModules = ["assert", "buffer", "child_process", "cluster", "console", "constants", "crypto", "dgram", "dns", "domain", "events", "freelist", "fs", "http", "https", "module", "net", "os", "path", "punycode", "querystring", "readline", "repl", "smalloc", "stream", "string_decoder", "sys", "timers", "tls", "tracing", "tty", "url", "util", "vm", "zlib"];

resolve = function(lookup, _module) {
  var dir, id;
  if (resolve.isCoreModule(lookup)) {
    id = lookup;
  } else if (/^\.{0,2}\//.test(lookup)) {
    dir = path.dirname(_module.filename);
    id = require.resolve(path.join(dir, lookup));
  } else {
    _.some(_module._paths, function(p) {
      var e;
      try {
        return id = require.resolve(path.join(p, lookup));
      } catch (_error) {
        e = _error;
        return false;
      }
    });
  }
  if (id == null) {
    throw new Error("Cannot find module '" + lookup + "'");
  }
  return id;
};

resolve.isCoreModule = function(mod) {
  return coreModules.indexOf(mod) > -1;
};

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

createContext = function(filepath, ctx) {
  var context, exec, script, source;
  source = fs.readFileSync(filepath, {
    encoding: "utf-8"
  });
  script = vm.createScript(source, filepath);
  context = {
    __require: require,
    __resolve: resolve,
    __transform: transform,
    __createContext: createContext,
    console: console,
    process: process,
    Buffer: Buffer,
    $conf: $conf,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
  };
  exec = function(ctx) {
    ctx = _.extend(ctx, context);
    ctx.global = ctx;
    return script.runInNewContext(ctx);
  };
  if (ctx != null) {
    return exec(ctx);
  } else {
    return exec;
  }
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
  return createContext(__dirname + "/env.js", {
    __main: filepath,
    $req: req,
    $res: res,
    $next: next
  });
});

core.use(express.directory(process.cwd()));

core.use(express["static"](process.cwd()));

module.exports = core;
