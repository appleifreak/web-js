_ = require "underscore"
cluster = require "cluster"
fs = require "fs"
{isMatch} = require "./helpers"
{AsyncQueue} = require "./async"
Promise = require "bluebird"

_.times $conf.get("threads"), -> cluster.fork()
cluster.on 'exit', (worker, code, signal) ->
	log = "Worker #{worker.process.pid} "
	if worker.suicide
		console.log log + "committed suicide. Restarting..."
		cluster.fork()
	else
		console.log log + "died (#{signal or code})."

class LoadQueue
	constructor: ->
		@workers = _.values(cluster.workers ? [])
		cluster.on 'fork', _.bind @addWorker, @
		cluster.on 'disconnect', _.bind @removeWorker, @

	addWorker: (worker) ->
		@workers.push worker

	removeWorker: (worker) ->
		@workers = _.without @workers, worker

	next: ->
		@index = if !@index? or ++@index >= @workers.length then 0 else @index
		return @workers[@index]

theQueue = new LoadQueue

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
	env =
		main: filepath
		request: $req
		config: $conf.get()

	worker = theQueue.next()
	worker.send env

	msg = (msg) ->
		return unless _.isObject(msg) and msg.type?
		
		switch msg.type
			when "header" then res.set(msg.key, msg.value)
			when "body" then res.write(msg.value)
			when "end" then done()

	done = ->
		worker.removeListener "message", msg
		worker.removeListener "disconnect", done
		res.end()

	worker.on "message", msg
	worker.on "disconnect", done

	# worker.on "exit", -> res.end()

	# worker.on 'listening', -> worker.disconnect()