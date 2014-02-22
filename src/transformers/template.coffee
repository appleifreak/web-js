_ = require "underscore"

noMatch = /(.)^/
escapes =
	"'":      "'",
	'\\':     '\\',
	'\r':     'r',
	'\n':     'n',
	'\t':     't',
	'\u2028': 'u2028',
	'\u2029': 'u2029'
escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g

esc = """(function() {
	var entityMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;'
	};

	var entityRegex = new RegExp('[' + Object.keys(entityMap).join('') + ']', 'g');

	return function(str) { 
		return str == null ? '' : ('' + str).replace(entityRegex, function(m) { return entityMap[m]; });
	}
})()
"""

module.exports = (api, settings) ->
	_.defaults settings, variable: "$", _.templateSettings
	
	matcher = new RegExp([
		(settings.escape || noMatch).source,
		(settings.interpolate || noMatch).source,
		(settings.evaluate || noMatch).source
	].join('|') + '|$', 'g')

	api.registerExtension settings.extensions ? "html"

	return (text) ->
		index = 0
		source = "__p+='"
		aloEsc = false
		
		text.replace matcher, (match, escape, interpolate, evaluate, offset) ->
			source += text.slice(index, offset)
				.replace escaper, (match) -> '\\' + escapes[match]

			if escape
				aloEsc = true
				source += "'+\n((__t=(#{escape}))==null?'':__e(__t))+\n'"
			if interpolate then source += "'+\n((__t=(#{interpolate}))==null?'':__t)+\n'"
			if evaluate then source += "';\n#{evaluate}\n__p+='"

			index = offset + match.length
			return match

		source += "';\n";

		unless settings.variable then source = "with(obj||{}){\n#{source}}\n"

		header = "module.exports=(function(#{settings.variable or ""}){var __t,__p='',__j=Array.prototype.join,"
		if aloEsc then header += "__e=#{esc},"
		header += "print=function(){__p+=__j.call(arguments,'');};\n"

		footer = "return __p;})();\nif (require.main === module) { $res.send(200, module.exports); }\n"

		return header + source + footer