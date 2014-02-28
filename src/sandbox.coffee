_ = require "underscore"
path = require "path"
{isQueryMatch, generate} = require "./helpers"
createNewModuleContext = require "./module"

createContext = (filename, sandbox) ->
	_.extend sandbox, {
		__createContext: createContext
		$config: $conf.get()
		console, process, Buffer, root
		setTimeout, clearTimeout, setInterval, clearInterval
	}

	sandbox.global = sandbox
	modctx = createNewModuleContext filename, sandbox
	modctx.runMain()

	return modctx

allow = $conf.get("sandbox.allow") ? []
allow.push $or:
	_.chain(require "./transformers").values()
	.pluck("extensions").flatten().unique()
	.map (e) -> "**/*" + e
	.value()
	.concat "**/*.js"

module.exports = (req, res, next) ->
	return next() unless req.relative?

	# make sure we are allowed to be here
	return next() unless isQueryMatch req.relative, allow

	# make the context
	sandbox = generate(req, res, next)
	createContext req.filename, sandbox