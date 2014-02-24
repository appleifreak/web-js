_ = require "underscore"
fs = require 'fs'
path = require 'path'
express = require "express"
{isQueryMatch} = require "./helpers"

directory = express.directory process.cwd()

module.exports = (req, res, next) ->
	return next() unless req.filename?
	relative = path.relative process.cwd(), req.filename

	# make sure we are allowed to be here
	patterns = $conf.get("static.patterns") ? []
	return next() unless isQueryMatch relative, patterns

	# serve directories as html documents
	if req.stat.isDirectory() and $conf.get("static.directory")
		return directory.apply this, arguments

	# get the content type
	ext = path.extname req.filename
	type = _.find $conf.get("static.mimetypes") ? [], (m, e) -> ext is m
	type = ext unless type?

	# serve
	res.type type
	fs.createReadStream(req.filename).pipe res