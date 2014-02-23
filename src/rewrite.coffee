_ = require "underscore"
fs = require "fs"
path = require "path"
{isMatch} = require "./helpers"

module.exports = (req, res, next) ->
	# ignore certain paths
	parts = req.path.split "/"
	ignored = _.some parts, (part, i) ->
		part = part + "/" if i+1 isnt parts.length
		_.some $conf.get("http.ignore"), (p) -> isMatch part, p
	if ignored then return next new HTTPError 404, "Not Found."

	# get the true filename by cwd
	req.filename = path.join process.cwd(), req.path
	return next() unless fs.existsSync req.filename

	# adjust filename for directories
	if fs.statSync(req.filename).isDirectory()
		dirfiles = fs.readdirSync req.filename
		index = _.find dirfiles, (f) -> _.some $conf.get("http.index"), (p) -> isMatch f, p
		return next() unless index?
		req.filename = path.join req.filename, index

	next()