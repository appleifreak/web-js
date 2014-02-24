var app, express, http;

express = require("express");

http = require("http");

app = express();

global.HTTPError = (function() {
  function HTTPError(code, message) {
    var stack;
    this.code = code;
    this.message = message;
    stack = (new Error).stack.split("\n").slice(2);
    stack.unshift(this.toString());
    this.stack = stack.join("\n");
  }

  HTTPError.prototype = new Error;

  HTTPError.prototype.toString = function() {
    return "" + this.name + ": [" + this.code + "] " + this.message;
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

app.use(function(err, req, res, next) {
  var code, env, msg, _ref;
  env = $conf.get("env");
  code = (_ref = err.code) != null ? _ref : 500;
  msg = code === 500 && env === "development" ? err.stack : err.message;
  return res.send(code, msg);
});

http.createServer(app).listen($conf.get("http.port"), function() {
  return process.send("READY");
});
