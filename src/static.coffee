_ = require "underscore"
fs = require 'fs'
path = require 'path'
express = require "express"
{isQueryMatch} = require "./helpers"

directory = express.directory process.cwd()

module.exports = (req, res, next) ->
	return next() unless req.relative?

	# make sure we are allowed to be here
	allow = $conf.get("static.allow") ? []
	return next() unless isQueryMatch req.relative, allow

	# serve directories as html documents
	if req.stat.isDirectory() and $conf.get("static.directory")
		return directory.apply this, arguments

	# get the content type
	ext = path.extname req.filename
	type = _.find $conf.get("static.mime_types") ? [], (m, e) -> ext is m
	type = ext unless type?

	# serve
	res.type type
	fs.createReadStream(req.filename).pipe res