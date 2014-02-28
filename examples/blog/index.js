var _ = require("underscore"),
	Promise = require("bluebird"),
	glob = Promise.promisify(require("glob")),
	web = require("web-js"),
	readFile = Promise.promisify(require("fs").readFile),
	html = require("./templates/list.html");

var markdown = web.transformers.markdown,
	parse = markdown.fn.parse;

var templateData = {
	title: "My Blog",
	style: "foghorn.css"
}

glob("articles/*{/index,}.+(md|markdown)")
	.map(function(file) {
		return readFile(file, "utf-8")
			.then(parse)
			.then(function(data) {
				data.date = new Date(data.date);
				data.file = file;
				data.url = url(file);
				return data;
			});
	})
	.then(function(articles) {
		articles.sort(function(a, b) {
			return a.date - b.date;
		}).reverse();
		var data = _.extend({ articles: articles }, templateData);
		echo(html(data));
		end();
	})
	.catch(function(err) {
		console.error(err.stack);
		$next(err);
	});