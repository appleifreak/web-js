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

allow = $conf.get("sandbox.allow") ? []
allow.push $or:
	_.chain(require "./transformers")
	.pluck("extensions").flatten().unique()
	.map (e) -> "**/*" + e
	.value()
	.concat "**/*.js"

module.exports = (req, res, next) ->
	return next() unless req.relative?

	# make sure we are allowed to be here
	return next() unless isQueryMatch req.relative, allow
	
	# some easy to use globals functions
	echo = (args...) ->
		args.forEach (v) -> res.write v
		return
	header = _.bind res.set, res
	statusCode = _.bind res.status, res
	contentType = _.bind res.type, res
	end = _.bind res.end, res

	# dynamic urls
	dirpath = path.dirname path.join "/", req.relative
	base = $conf.get("http.url_base") ? ""
	if base.substr(-1) is "/" then base = base.substr 0, base.length - 1
	url = (p) -> base + path.resolve dirpath, p

	createContext req.filename, {
		$request: req
		$response: res
		$next: next
		echo, header, statusCode, contentType, end, url
	}