var fs, less, path, _;

_ = require("underscore");

fs = require("fs");

path = require("path");

less = require("less");

module.exports = function(options) {
  var cwd, t;
  _.defaults(options, {
    extensions: [".less"]
  });
  cwd = $conf.get("cwd");
  t = function(_module, filename) {
    var source, text;
    text = fs.readFileSync(filename, 'utf-8');
    source = t.render(text, {
      filename: path.basename(filename)
    });
    _module._compile("contentType(\"css\");\nwrite(" + (JSON.stringify(source)) + ");\nend();", filename);
  };
  t.render = function(text, opts) {
    var source;
    if (opts == null) {
      opts = {};
    }
    _.extend(opts, options, {
      paths: [cwd],
      syncImport: true
    });
    source = "";
    less.render(text, opts, function(e, css) {
      if (e != null) {
        throw e;
      }
      return source = css;
    });
    return source;
  };
  return t;
};
