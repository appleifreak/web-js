var allow, createContext, createNewModuleContext, isQueryMatch, path, _, _ref,
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

allow = (_ref = $conf.get("sandbox.allow")) != null ? _ref : [];

allow.push({
  $or: _.chain(require("./transformers")).pluck("extensions").flatten().unique().map(function(e) {
    return "**/*" + e;
  }).value().concat("**/*.js")
});

module.exports = function(req, res, next) {
  var base, contentType, dirpath, echo, end, header, statusCode, url, _ref1;
  if (req.relative == null) {
    return next();
  }
  if (!isQueryMatch(req.relative, allow)) {
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
  dirpath = path.dirname(path.join("/", req.relative));
  base = (_ref1 = $conf.get("http.url_base")) != null ? _ref1 : "";
  if (base.substr(-1) === "/") {
    base = base.substr(0, base.length - 1);
  }
  url = function(p) {
    return base + path.resolve(dirpath, p);
  };
  return createContext(req.filename, {
    $request: req,
    $response: res,
    $next: next,
    echo: echo,
    header: header,
    statusCode: statusCode,
    contentType: contentType,
    end: end,
    url: url
  });
};
