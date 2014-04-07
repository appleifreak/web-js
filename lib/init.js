var app, conf, express, http, path, _;

_ = require("underscore");

express = require("express");

http = require("http");

path = require("path");

conf = require("./config");

global.HTTPError = (function() {
  function HTTPError(statusCode, message) {
    var stack, _ref;
    this.statusCode = statusCode;
    this.message = message;
    if (this.message == null) {
      this.message = (_ref = http.STATUS_CODES[statusCode]) != null ? _ref : "Server Error";
    }
    stack = (new Error).stack.split("\n").slice(2);
    stack.unshift(this.toString());
    this.stack = stack.join("\n");
  }

  HTTPError.prototype = new Error;

  HTTPError.prototype.toString = function() {
    return "" + this.name + ": [" + this.statusCode + "] " + this.message;
  };

  HTTPError.prototype.name = "HTTPError";

  return HTTPError;

})();

module.exports = app = express();

_.each(conf.get("plugins"), function(options, name) {
  var plugin;
  if (!_.isObject(options)) {
    options = [options];
  }
  if (/^\.{0,2}\//.test(name)) {
    plugin = require(path.resolve(conf.get("cwd"), name));
  } else {
    plugin = require(name);
  }
  if (_.isFunction(plugin)) {
    return plugin.call(null, app, options);
  }
});

app.use(express.logger("dev"));

if (conf.get("http.compress")) {
  app.use(express.compress());
}

app.use(require("./rewrite"));

_.each(conf.get("http.middleware"), function(args, name) {
  var mid;
  if (!_.isArray(args)) {
    args = [args];
  }
  if (express[name] != null) {
    mid = express[name];
  } else if (/^\.{0,2}\//.test(name)) {
    mid = require(path.resolve(conf.get("cwd"), name));
  } else {
    mid = require(name);
  }
  if (_.isFunction(mid)) {
    return app.use(mid.apply(app, args));
  }
});

if (conf.get("sandbox.enabled")) {
  app.use(require("./sandbox"));
}

if (conf.get("static.enabled")) {
  app.use(require("./static"));
}

app.use(function(req, res, next) {
  return next(new HTTPError(404));
});

app.use(function(err, req, res, next) {
  var code, env, msg, _ref;
  env = process.env.NODE_ENV;
  code = (_ref = err.statusCode) != null ? _ref : 500;
  msg = code === 500 && env === "development" ? err.stack : err.message;
  res.type("text");
  return res.send(code, code + " " + msg);
});

app.start = function(onReady) {
  return http.createServer(app).listen(conf.get("http.port"), onReady);
};
