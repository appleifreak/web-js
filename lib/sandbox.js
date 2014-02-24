var createContext, createNewModuleContext, isQueryMatch, path, patterns, _, _ref,
  __slice = [].slice;

_ = require("underscore");

path = require("path");

isQueryMatch = require("./helpers").isQueryMatch;

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

patterns = (_ref = $conf.get("sandbox.patterns")) != null ? _ref : [];

patterns.push({
  $or: _.chain(require("./transformers")).pluck("extensions").flatten().unique().map(function(e) {
    return "**/*" + e;
  }).value().concat("**/*.js")
});

module.exports = function(req, res, next) {
  var contentType, echo, end, header, relative, statusCode;
  if (req.filename == null) {
    return next();
  }
  relative = path.relative(process.cwd(), req.filename);
  if (!isQueryMatch(relative, patterns)) {
    return next();
  }
  echo = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    args.forEach(function(v) {
      return res.write(v);
    });
  };
  header = _.bind(res.set, res);
  statusCode = _.bind(res.status, res);
  contentType = _.bind(res.type, res);
  end = _.bind(res.end, res);
  return createContext(req.filename, {
    $request: req,
    $response: res,
    $next: next,
    echo: echo,
    header: header,
    statusCode: statusCode,
    contentType: contentType,
    end: end
  });
};
