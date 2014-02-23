_ = require "underscore"
express = require "express"
fs = require "fs"
{Minimatch} = require "minimatch"
{isMatch} = require "./helpers"
createNewModuleContext = require "./module"

config = $conf.get "sandbox"
transformers = []
validFiles = config.patterns ? []

_.each config.transformers, (options, name) ->
	unless _.isObject(options) then options = {}
	trans = { name, patterns: [] }

	api =
		registerPattern: (matches...) ->
			_.each _.flatten(matches), (m) ->
				if _.isString(m) then m = new Minimatch m
				trans.patterns.push m
				validFiles.push m
			return
		registerExtension: (exts...) ->
			_.each _.flatten(exts), (ext) ->
				ext = "." + ext if ext[0] isnt "."
				api.registerPattern "**/*" + ext
			return

	trans.fn = require("./transformers/#{name}")(api, options)
	transformers.push trans

transform = (filename, source) ->
	trans = _.find transformers, (t) ->
		_.some t.patterns, (p) -> isMatch filename, p
	return if trans? then trans.fn(source) else source

createContext = (filepath, sandbox) ->
	_.extend sandbox, {
		__createContext: createContext
		console, process, Buffer, $conf, root
		setTimeout, clearTimeout, setInterval, clearInterval
	}

	sandbox.global = sandbox
	modctx = createNewModuleContext filepath, sandbox
	modctx.runMain()

	return modctx

core = express()

core.use (req, res, next) ->
	filepath = process.cwd() + req.path
	return next() unless fs.existsSync(filepath)
	
	if fs.statSync(filepath).isDirectory()
		dirfiles = fs.readdirSync filepath
		index = _.find dirfiles, (f) -> _.some config.index, (p) -> isMatch f, p
		return next() unless index?
		filepath += index

	return next() unless _.some validFiles, (p) -> isMatch filepath, p

	createContext filepath, $req: req, $res: res, $next: next

core.use express.directory process.cwd()
core.use express.static process.cwd()

module.exports = core