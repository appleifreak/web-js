var app, errorCodes, express, http;

express = require("express");

http = require("http");

app = express();

errorCodes = {};

global.HTTPError = (function() {
  function HTTPError(code, message) {
    var stack, _ref;
    this.code = code;
    this.message = message;
    if (this.message == null) {
      this.message = (_ref = HTTPError._humanReadable[code]) != null ? _ref : "Server Error";
    }
    stack = (new Error).stack.split("\n").slice(2);
    stack.unshift(this.toString());
    this.stack = stack.join("\n");
  }

  HTTPError.prototype = new Error;

  HTTPError.prototype.toString = function() {
    return "" + this.name + ": [" + this.code + "] " + this.message;
  };

  HTTPError.prototype.name = "HTTPError";

  HTTPError._humanReadable = {
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error"
  };

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
  code = (_ref = err.code) != null ? _ref : 500;
  msg = code === 500 && env === "development" ? err.stack : err.message;
  res.type("text");
  return res.send(code, code + " " + msg);
});

http.createServer(app).listen($conf.get("http.port"), function() {
  return process.send("READY");
});
