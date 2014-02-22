coffee = require "coffee-script"

module.exports = (api, options) ->
	# _.defaults options, {}
	api.registerExtension options.extensions ? "coffee"
	return (text) -> coffee.compile text, options