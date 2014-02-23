fs = require "fs"
Module = require "module"
tasks = []
running = false

Module._contextLoad = true

process.on "message", (data) ->
	tasks.push data
	runNextTask()

# helpers
global.echo = (args...) ->
	args.forEach (v) ->
		process.send { type: "body", value: v }

global.end = ->
	process.send { type: "end", value: true }
	clean()

global.header = (k, val) ->
	process.send
		type: "header"
		key: k
		value: val

deleteChildren = (mod) ->
	mod.children.slice(0).forEach (m) ->
		console.log m.id
		deleteChildren(m) if m.children.length
		delete Module._cache[m.id]
	mod.children = []
	return

clean = ->
	# we're not currently running
	running = false

	# delete special global variables
	# Object.keys(global).forEach (k) -> delete global[k] if k[0] is "$"
	
	# delete all children modules
	console.log Object.keys(Module._cache).length
	deleteChildren module
	delete Module._cache[module.id]
	console.log Object.keys(Module._cache).length

	# try to run the next task
	runNextTask()

# runs the tasks
runNextTask = ->
	return if running
	running = true

	process.nextTick ->
		task = tasks.shift()
		return unless task?

		filename = task.main
		# source = fs.readFileSync filename, encoding: "utf-8"

		# set up global
		# Object.keys(task).forEach (k) -> global["$#{k}"] = task[k]
		
		# and away we go
		require filename

		# mod = new Module filename, module
		# mod.filename = filename
		# mod.paths = Module._nodeModulePaths process.cwd()
		# mod._compile source, filename


# # import the instance data
# [ "REQUEST", "CONFIG", "MAIN" ].forEach (k) ->
# 	try global["$#{k.toLowerCase()}"] = JSON.parse(process.env["X_#{k}"])

# # some helpers
# global.exit = -> process.exit()

# global.echo = (args...) ->
# 	args.forEach (v) -> process.send v

# global.end = -> echo null

# global.header = (k, val) ->
# 	echo
# 		type: "header"
# 		key: k
# 		value: val

# # and away we go
# require($main);