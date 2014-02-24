var marked = require("marked"),
	fs = require("fs");

function wrapper(html) {
	return "module.exports=" + JSON.stringify(html) +
		"\nif (require.main === module) { echo(module.exports); end(); }";
}

module.exports = function(options) {
	if (options.extensions == null) {
		options.extensions = [ ".md", ".markdown" ];
	}

	return function(_module, filename) {
		var text = fs.readFileSync(filename, "utf-8"),
			html = marked(text),
			source = wrapper(html);

		_module._compile(source, filename);
	}
}

