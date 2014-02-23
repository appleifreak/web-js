_ = require "underscore"

module.exports =
transformers = []
config = $conf.get "sandbox.transformers"

_.each config, (options, name) ->
	return unless options # do nothing if options is false
	unless _.isObject(options) then options = {}

	trans = { name, options }
	trans.fn = require("./#{name}")(options)
	trans.extensions = options.extensions ? []
	
	transformers.push trans