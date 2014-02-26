var _ = require("underscore"),
	glob = require("glob"),
	web = require("web-js"),
	Promise = require("bluebird");

var markdown = web.transformers.markdown,
	parse = _.partial(markdown.fn.parse, _, markdown.options);

glob("articles/*{/index,}.md", function(err, files) {
	if (err) return $next(err);
	
	_.each(files, function(f) {
		echo(f + "\n");
	});

	end();
});