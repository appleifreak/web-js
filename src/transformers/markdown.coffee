_ = require "underscore"
marked = require "marked"
fs = require "fs"
path = require "path"

wrapper = (src) ->
	return "module.exports=(#{src})();" +
		"\nif (require.main === module) { contentType(\"html\"); echo(module.exports); end(); }"

html = _.template """<!DOCTYPE html>
<html lang="en-US">
	<head>
		<meta charset="UTF-8" />
		<title><%= $.title != null && $.title !== "" ? $.title : require("path").basename(__filename) %></title>
		<!--[if lt IE 9]><script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
		
		<% if ($.style == null) $.style = [];
		if (!Array.isArray($.style)) $.style = [ $.style ];
		$.style.forEach(function(s) { %>
		<link rel="stylesheet" href="<%= url(s) %>" type="text/css" />
		<% }); %>
	</head>
	<body>
		<%= $.body %>
	</body>
</html>""", null, variable: "$"

tryYAML = (text) ->
	try return require("js-yaml").safeLoad text
	catch e then return false

module.exports = (options) ->
	_.defaults options,
		extensions: [ ".md", ".markdown" ]

	return (_module, filename) ->
		text = fs.readFileSync(filename, "utf-8")
		source = wrapper render text, options

		_module._compile source, filename

parse =
module.exports.parse = (text, options = {}) ->	
	_.defaults options,
		breaks: true
		content_break: "-----"
		template_data: {}

	# break into parts
	parts = text.split "\n"
	parts = parts.reduce (m, p) ->
		if p is options.content_break then m.push ""
		else m[m.length - 1] += p + "\n"
		return m
	, [""]

	# parse for meta data
	meta = {}

	_.some parts, (p, i) ->
		return if _.isEmpty(p)
		
		data = tryYAML(p)
		return unless _.isObject(data) and !_.isEmpty(data)
		
		meta = data
		parts = parts.slice i + 1
		return true
	
	_.defaults meta, options.template_data ? {}

	# parse the body
	md = parts.join(options.content_break + "\n")
	body = marked md, options
	data = _.extend meta, { body }

	return data
	
render =
module.exports.render = (text, options = {}) ->
	_.defaults options,
		template: null

	data = parse text, options

	tpl = options.template
	unless _.isEmpty(tpl) then tpl = path.resolve process.cwd(), tpl
	else tpl = options.template_data.template
	if _.isEmpty(tpl) then tpl = html.source
	else tpl = """require("#{unless /^\.{0,2}\//.test(tpl) then "./" else ""}#{tpl}")"""

	return """function(){
		return (#{tpl}).call(this, #{JSON.stringify(data)});
	}"""