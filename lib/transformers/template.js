var esc, escaper, escapes, fs, noMatch, _;

_ = require("underscore");

fs = require('fs');

noMatch = /(.)^/;

escapes = {
  "'": "'",
  '\\': '\\',
  '\r': 'r',
  '\n': 'n',
  '\t': 't',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

esc = "(function() {\nvar entityMap = {\n	'&': '&amp;',\n	'<': '&lt;',\n	'>': '&gt;',\n	'\"': '&quot;',\n	\"'\": '&#x27;'\n};\n\nvar entityRegex = new RegExp('[' + Object.keys(entityMap).join('') + ']', 'g');\n\nreturn function(str) { \n	return str == null ? '' : ('' + str).replace(entityRegex, function(m) { return entityMap[m]; });\n}\n})()";

module.exports = function(settings) {
  var matcher;
  _.defaults(settings, {
    variable: "$"
  }, _.templateSettings);
  matcher = new RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g');
  if (settings.extensions == null) {
    settings.extensions = [".html"];
  }
  return function(_module, filename) {
    var aloEsc, footer, header, index, source, text;
    text = fs.readFileSync(filename, 'utf-8');
    index = 0;
    source = "__p+='";
    aloEsc = false;
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, function(match) {
        return '\\' + escapes[match];
      });
      if (escape) {
        aloEsc = true;
        source += "'+\n((__t=(" + escape + "))==null?'':__e(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";
    if (!settings.variable) {
      source = "with(obj||{}){\n" + source + "}\n";
    }
    header = "module.exports=(function(" + (settings.variable || "") + "){var __t,__p='',__j=Array.prototype.join,";
    if (aloEsc) {
      header += "__e=" + esc + ",";
    }
    header += "print=function(){__p+=__j.call(arguments,'');};\n";
    footer = "return __p;})();\nif (require.main === module) { echo(module.exports); end(); }\n";
    _module._compile(header + source + footer, filename);
  };
};
