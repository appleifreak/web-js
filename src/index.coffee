cluster = require 'cluster'

# make conf global
$conf =
global.$conf = require "./config"

# if cluster.isMaster then require "./master"
# else require "./child"

# fire up the cores
if cluster.isMaster
	threads = $conf.get("threads")
	cluster.fork() for [0...threads]
	console.log "Started #{threads} workers."

	waiting = threads
	for id, w of cluster.workers
		w.on "message", (msg) ->
			if msg is "READY" then waiting--
			if waiting is 0 then console.log "HTTP server listening on port #{$conf.get "http.port"}."

	cluster.on 'exit', (worker, code, signal) ->
		console.log "Worker #{worker.process.pid} died."

else
	require "./init"