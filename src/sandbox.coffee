_ = require "underscore"
path = require "path"
{isQueryMatch} = require "./helpers"
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

patterns = $conf.get("sandbox.patterns") ? []
patterns.push $or:
	_.chain(require "./transformers")
	.pluck("extensions").flatten().unique()
	.map (e) -> "**/*" + e
	.value()
	.concat "**/*.js"

module.exports = (req, res, next) ->
	return next() unless req.filename?
	relative = path.relative process.cwd(), req.filename

	# make sure we are allowed to be here
	return next() unless isQueryMatch relative, patterns
	
	# some easy to use globals functions
	echo = (args...) ->
		args.forEach (v) -> res.write v
		return
	header = _.bind res.set, res
	statusCode = _.bind res.status, res
	contentType = _.bind res.type, res
	end = _.bind res.end, res

	createContext req.filename, {
		$request: req
		$response: res
		$next: next
		echo, header, statusCode, contentType, end
	}