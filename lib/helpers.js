var Minimatch, isMatch, path, stripIndex, _,
  __slice = [].slice;

_ = require("underscore");

Minimatch = require("minimatch").Minimatch;

path = require("path");

isMatch = exports.isMatch = function(filename, pattern) {
  if (_.isString(pattern)) {
    pattern = new Minimatch(pattern);
  }
  if (pattern instanceof Minimatch) {
    return pattern.match(filename);
  } else if (_.isRegExp(pattern)) {
    return pattern.test(filename);
  } else {
    return pattern === filename;
  }
};

exports.isQueryMatch = function(filename, rules) {
  var rMatch;
  rMatch = function(rule, key) {
    if (_.isObject(rule)) {
      if (key === "$or") {
        return _.any(rule, rMatch);
      } else {
        return _.every(rule, rMatch);
      }
    }
    return isMatch(filename, rule);
  };
  return rMatch(rules);
};

stripIndex = exports.stripIndex = function(filepath) {
  var name;
  name = path.basename(filepath);
  if (_.some($conf.get("http.index"), function(p) {
    return isMatch(name, p);
  })) {
    filepath = path.dirname(filepath);
  }
  return filepath;
};

exports.generate = function(req, res, next) {
  return {
    $request: req,
    $response: res,
    $next: next,
    write: _.bind(res.write, res),
    header: _.bind(res.set, res),
    statusCode: _.bind(res.status, res),
    contentType: _.bind(res.type, res),
    end: _.bind(res.end, res),
    echo: function() {
      var args, vals;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      vals = args.map(function(v) {
        if (_.isString(v) || _.isNumber(v)) {
          return v;
        } else {
          return JSON.stringify(v);
        }
      });
      res.write(vals.join(" ") + "\n", "utf-8");
    },
    $resolvePath: (function() {
      var base, dirpath, _ref;
      dirpath = path.dirname(path.join("/", req.relative));
      base = (_ref = $conf.get("http.url_base")) != null ? _ref : "";
      if (base.substr(-1) === "/") {
        base = base.substr(0, base.length - 1);
      }
      return function(p) {
        return base + path.resolve(dirpath, stripIndex(p));
      };
    })()
  };
};

exports.basicWrapper = function(src, type) {
  if (type == null) {
    type = "html";
  }
  return "module.exports=" + src + ";\nif (require.main === module) {\n	var content = typeof module.exports === \"function\" ? module.exports.call(this) : module.exports;\n	contentType(" + (JSON.stringify(type)) + ");\n	$response.set(\"Content-Length\", content.length);\n	write(content);\n	end();\n}";
};
