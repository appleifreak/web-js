_ = require "underscore"
express = require "express"
http = require "http"
path = require "path"

# keep things dry
global._pkg = require "../package.json"

# new express app
app = express()

class global.HTTPError
	constructor: (@statusCode, @message) ->
		@message ?= http.STATUS_CODES[statusCode] ? "Server Error"
		stack = (new Error).stack.split("\n").slice(2)
		stack.unshift @toString()
		@stack = stack.join("\n")
	@:: = new Error
	toString: -> "#{@name}: [#{@statusCode}] #{@message}"
	name: "HTTPError"

# default middleware
app.use express.logger "dev"
if $conf.get "http.compress" then app.use express.compress()
app.use require "./rewrite"

# user middleware
_.each $conf.get("http.middleware"), (m) ->
	if _.isArray(m) then [name, args...] = m
	else [name, args] = [m, []]

	if express[name]? then mid = express[name]
	else if /^.{0,2}\//.test(name) then mid = require path.resolve $conf.get("cwd"), name
	else mid = require name

	if _.isFunction(mid) then app.use mid.apply null, args

# sandbox and static files
if $conf.get "sandbox.enabled" then app.use require "./sandbox"
if $conf.get "static.enabled" then app.use require "./static"

# last route: 404
app.use (req, res, next) -> next new HTTPError 404

# custom error handle
app.use (err, req, res, next) ->
	env = $conf.get("env")
	code = err.statusCode ? 500
	msg = if code is 500 and env is "development" then err.stack else err.message

	res.type "text"
	res.send code, code + " " + msg

# start the server
http.createServer(app).listen $conf.get("http.port"), ->
	process.send "READY"