_ = require "underscore"
cluster = require "cluster"
fs = require "fs"
{isMatch} = require "./helpers"

config = $conf.get "sandbox"

module.exports = (req, res, next) ->
	filepath = process.cwd() + req.path
	return next() unless fs.existsSync(filepath)
	
	if fs.statSync(filepath).isDirectory()
		dirfiles = fs.readdirSync filepath
		index = _.find dirfiles, (f) -> _.some config.index, (p) -> isMatch f, p
		return next() unless index?
		filepath += index

	return next() unless _.some config.patterns, (p) -> isMatch filepath, p

	$req = _.pick req, "query", "method", "url", "headers", "ip", "body", "path"
	env = _.chain(
		main: filepath
		request: $req
		config: $conf.get()
	).map (v, k) -> [ "X_#{k.toUpperCase()}", JSON.stringify(v) ]
	.object().value()

	worker = cluster.fork env

	worker.on "message", (msg) ->
		if _.isObject(msg) and msg.type?
			switch msg.type
				when "header" then res.set(msg.key, msg.value)
		
		else unless _.isEmpty(msg) then res.write(msg)
		else res.end()

	worker.on "exit", -> res.end()