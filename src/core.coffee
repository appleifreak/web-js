_ = require "underscore"
express = require "express"
path = require "path"
fs = require "fs"
vm = require "vm"
{Minimatch} = require "minimatch"
{isMatch} = require "./helpers"

config = $conf.get "sandbox"

coreModules = [ "assert", "buffer", "child_process", "cluster", "console", "constants", "crypto", "dgram", "dns", "domain", "events", "freelist", "fs", "http", "https", "module", "net", "os", "path", "punycode", "querystring", "readline", "repl", "smalloc", "stream", "string_decoder", "sys", "timers", "tls", "tracing", "tty", "url", "util", "vm", "zlib" ]

resolve = (lookup, _module) ->
	if resolve.isCoreModule(lookup) then id = lookup
	else if /^\.{0,2}\//.test(lookup)
		dir = path.dirname _module.filename
		id = require.resolve path.join dir, lookup
	else _.some _module._paths, (p) ->
		try id = require.resolve path.join p, lookup
		catch e then false
	unless id? then throw new Error "Cannot find module '#{lookup}'"
	return id

resolve.isCoreModule = (mod) -> coreModules.indexOf(mod) > -1

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

createContext = (filepath, ctx) ->
	source = fs.readFileSync filepath, encoding: "utf-8"
	script = vm.createScript source, filepath

	context = {
		__require: require
		__resolve: resolve
		__transform: transform
		__createContext: createContext
		console, process, Buffer, $conf
		setTimeout, clearTimeout, setInterval, clearInterval
	}
	
	exec = (ctx) ->
		ctx = _.extend ctx, context
		ctx.global = ctx
		script.runInNewContext ctx
	
	return if ctx? then exec(ctx) else exec

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

	createContext __dirname + "/env.js", __main: filepath, $req: req, $res: res, $next: next

core.use express.directory process.cwd()
core.use express.static process.cwd()

module.exports = core