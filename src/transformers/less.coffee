_ = require "underscore"
fs = require "fs"
path = require "path"
less = require "less"

module.exports = (options) ->
	_.defaults options, extensions: [ ".less" ]
	cwd = $conf.get("cwd")

	t = (_module, filename) ->
		text = fs.readFileSync filename, 'utf-8'
		source = t.render text, { filename: path.basename filename }

		_module._compile """
		contentType("css");
		write(#{JSON.stringify(source)});
		end();
		""", filename
		return

	t.render = (text, opts = {}) ->
		_.extend opts, options,
			paths: [ cwd ],
			syncImport: true
		
		source = ""
		less.render text, opts, (e, css) ->
			if e? then throw e
			source = css

		return source

	return t