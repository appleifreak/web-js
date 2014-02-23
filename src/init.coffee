express = require "express"
http = require "http"

# new express app
app = express()

class global.HTTPError
	constructor: (@code, @message) ->
		stack = (new Error).stack.split("\n").slice(2)
		stack.unshift @toString()
		@stack = stack.join("\n")
	@:: = new Error
	toString: -> "#{@name}: [#{@code}] #{@message}"
	name: "HTTPError"

# default middleware
app.use express.logger "dev"
app.use require "./rewrite"
app.use require "./core"
app.use express.directory process.cwd()
app.use express.static process.cwd()

# custom error handle
app.use (err, req, res, next) ->
	env = $conf.get("env")
	code = err.code ? 500
	msg = if code is 500 and env is "development" then err.stack else err.message

	res.send code, msg

# start the server
http.createServer(app).listen $conf.get("http.port"), ->
	process.send "READY"