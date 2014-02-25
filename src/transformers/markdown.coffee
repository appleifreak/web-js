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
		breaks: true
		content_break: "-----"
		template: null
		template_data: {}

	# bind options
	module.exports.render = 
	_render = (text, opts = {}) ->
		return render text, _.extend opts, options

	return (_module, filename) ->
		text = fs.readFileSync(filename, "utf-8")
		source = wrapper _render text

		_module._compile source, filename

render =
module.exports.render = (text, options = {}) ->
	# break into parts
	parts = text.split "\n"
	parts = parts.reduce (m, p) ->
		if p is options.content_break then m.push ""
		else m[m.length - 1] += p + "\n"
		return m
	, [""]

	# parse for meta data
	meta = {}
	metaIndex = null
	_.some parts, (p, i) ->
		return if _.isEmpty(p)
		
		data = tryYAML(p)
		return unless _.isObject(data) and !_.isEmpty(data)
		
		meta = data
		metaIndex = i
		return true
	
	_.defaults meta, options.template_data ? {}
	if metaIndex? then parts = parts.slice(metaIndex + 1)

	# parse the body
	md = parts.join(options.content_break + "\n")
	body = marked md, options
	data = _.extend meta, { body }
	
	tpl = options.template
	unless _.isEmpty(tpl) then tpl = path.resolve process.cwd(), tpl
	else tpl = options.template_data.template
	if _.isEmpty(tpl) then tpl = html.source
	else tpl = """require("#{unless /^\.{0,2}\//.test(tpl) then "./" else ""}#{tpl}")"""

	return """function(){
		return (#{tpl}).call(this, #{JSON.stringify(data)});
	}"""