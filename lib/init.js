var app, express, http;

express = require("express");

http = require("http");

global._pkg = require("../package.json");

app = express();

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

app.use(express.logger("dev"));

app.use(require("./rewrite"));

if ($conf.get("sandbox.enabled")) {
  app.use(require("./sandbox"));
}

if ($conf.get("static.enabled")) {
  app.use(require("./static"));
}

app.use(function(req, res, next) {
  return next(new HTTPError(404));
});

app.use(function(err, req, res, next) {
  var code, env, msg, _ref;
  env = $conf.get("env");
  code = (_ref = err.statusCode) != null ? _ref : 500;
  msg = code === 500 && env === "development" ? err.stack : err.message;
  res.type("text");
  return res.send(code, code + " " + msg);
});

http.createServer(app).listen($conf.get("http.port"), function() {
  return process.send("READY");
});
