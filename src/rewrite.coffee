_ = require "underscore"
{isMatch} = require "./helpers"

ignore = $conf.get "http.ignore"

module.exports = (req, res, next) ->
	parts = req.path.split "/"
	ignored = _.some parts, (part, i) ->
		part = part + "/" if i+1 isnt parts.length
		_.some ignore, (p) -> isMatch part, p

	if ignored then next new HTTPError 404, "Not Found."
	else next()