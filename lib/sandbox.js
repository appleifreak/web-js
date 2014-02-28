var allow, createContext, createNewModuleContext, generate, isQueryMatch, path, _, _ref, _ref1;

_ = require("underscore");

path = require("path");

_ref = require("./helpers"), isQueryMatch = _ref.isQueryMatch, generate = _ref.generate;

createNewModuleContext = require("./module");

createContext = function(filename, sandbox) {
  var modctx;
  _.extend(sandbox, {
    __createContext: createContext,
    $config: $conf.get(),
    console: console,
    process: process,
    Buffer: Buffer,
    root: root,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
  });
  sandbox.global = sandbox;
  modctx = createNewModuleContext(filename, sandbox);
  modctx.runMain();
  return modctx;
};

allow = (_ref1 = $conf.get("sandbox.allow")) != null ? _ref1 : [];

allow.push({
  $or: _.chain(require("./transformers")).values().pluck("extensions").flatten().unique().map(function(e) {
    return "**/*" + e;
  }).value().concat("**/*.js")
});

module.exports = function(req, res, next) {
  var sandbox;
  if (req.relative == null) {
    return next();
  }
  if (!isQueryMatch(req.relative, allow)) {
    return next();
  }
  sandbox = generate(req, res, next);
  return createContext(req.filename, sandbox);
};
