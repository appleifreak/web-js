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
	req.stat = fs.statSync(req.filename)

	# adjust filename for directories
	if req.stat.isDirectory()
		dirfiles = fs.readdirSync req.filename
		index = _.find dirfiles, (f) -> _.some $conf.get("http.index"), (p) -> isMatch f, p

		if index?
			req.filename = path.join req.filename, index
			req.stat = fs.statSync(req.filename)

	next()