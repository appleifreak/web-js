var fs, html, marked, path, render, tryYAML, wrapper, _;

_ = require("underscore");

marked = require("marked");

fs = require("fs");

path = require("path");

wrapper = function(src) {
  return ("module.exports=(" + src + ")();") + "\nif (require.main === module) { contentType(\"html\"); echo(module.exports); end(); }";
};

html = _.template("<!DOCTYPE html>\n<html lang=\"en-US\">\n	<head>\n		<meta charset=\"UTF-8\" />\n		<title><%= $.title != null && $.title !== \"\" ? $.title : require(\"path\").basename(__filename) %></title>\n		<!--[if lt IE 9]><script src=\"http://html5shim.googlecode.com/svn/trunk/html5.js\"></script><![endif]-->\n		\n		<% if ($.style == null) $.style = [];\n		if (!Array.isArray($.style)) $.style = [ $.style ];\n		$.style.forEach(function(s) { %>\n		<link rel=\"stylesheet\" href=\"<%= url(s) %>\" type=\"text/css\" />\n		<% }); %>\n	</head>\n	<body>\n		<%= $.body %>\n	</body>\n</html>", null, {
  variable: "$"
});

tryYAML = function(text) {
  var e;
  try {
    return require("js-yaml").safeLoad(text);
  } catch (_error) {
    e = _error;
    return false;
  }
};

module.exports = function(options) {
  var _render;
  _.defaults(options, {
    extensions: [".md", ".markdown"],
    breaks: true,
    content_break: "-----",
    template: null,
    template_data: {}
  });
  module.exports.render = _render = function(text, opts) {
    if (opts == null) {
      opts = {};
    }
    return render(text, _.extend(opts, options));
  };
  return function(_module, filename) {
    var source, text;
    text = fs.readFileSync(filename, "utf-8");
    source = wrapper(_render(text));
    return _module._compile(source, filename);
  };
};

render = module.exports.render = function(text, options) {
  var body, data, md, meta, metaIndex, parts, tpl, _ref;
  if (options == null) {
    options = {};
  }
  parts = text.split("\n");
  parts = parts.reduce(function(m, p) {
    if (p === options.content_break) {
      m.push("");
    } else {
      m[m.length - 1] += p + "\n";
    }
    return m;
  }, [""]);
  meta = {};
  metaIndex = null;
  _.some(parts, function(p, i) {
    var data;
    if (_.isEmpty(p)) {
      return;
    }
    data = tryYAML(p);
    if (!(_.isObject(data) && !_.isEmpty(data))) {
      return;
    }
    meta = data;
    metaIndex = i;
    return true;
  });
  _.defaults(meta, (_ref = options.template_data) != null ? _ref : {});
  if (metaIndex != null) {
    parts = parts.slice(metaIndex + 1);
  }
  md = parts.join(options.content_break + "\n");
  body = marked(md, options);
  data = _.extend(meta, {
    body: body
  });
  tpl = options.template;
  if (!_.isEmpty(tpl)) {
    tpl = path.resolve(process.cwd(), tpl);
  } else {
    tpl = options.template_data.template;
  }
  if (_.isEmpty(tpl)) {
    tpl = html.source;
  } else {
    tpl = "require(\"" + (!/^\.{0,2}\//.test(tpl) ? "./" : "") + tpl + "\")";
  }
  return "function(){\n	return (" + tpl + ").call(this, " + (JSON.stringify(data)) + ");\n}";
};
