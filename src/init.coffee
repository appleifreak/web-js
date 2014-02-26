express = require "express"
http = require "http"

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
app.use require "./rewrite"
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