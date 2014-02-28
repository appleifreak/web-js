var _ = require("underscore"),
	Promise = require("bluebird"),
	glob = Promise.promisify(require("glob")),
	web = require("web-js"),
	readFile = Promise.promisify(require("fs").readFile),
	html = require("./templates/list.html");

var markdown = web.transformers.markdown,
	parse = markdown.fn.parse;

var templateData = $config.site || {},
	cwd = $config.cwd;

glob("articles/*{/index,}.+(md|markdown)", { cwd: cwd })
	.map(function(file) {
		return readFile(cwd + "/" + file, "utf-8")
			.then(parse)
			.then(function(data) {
				data.date = new Date(data.date);
				data.file = file;
				data.url = $resolvePath(file);
				return data;
			});
	})
	.then(function(articles) {
		articles.sort(function(a, b) {
			return b.date - a.date;
		});

		var data = _.extend({ articles: articles }, templateData),
			content = html(data);

		contentType("html");
		$response.set("Content-Length", content.length);
		write(content);
		end();
	})
	.catch(function(err) {
		console.error(err.stack);
		$next(err);
	});