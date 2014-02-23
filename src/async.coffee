{EventEmitter} = require "events"
_ = require "underscore"
Promise = require "bluebird"

# Waits on several async callbacks to be called and
# then calls onEmpty. Technically should be called
# at least once, otherwise acts as a deferred call
# to onEmpty. Resusable.
exports.wait =
asyncWait = (onEmpty) ->
	counter = 0

	callback = (cb) ->
		counter++
		return _.once ->
			counter--
			cb.apply @, arguments if _.isFunction cb
			onEmpty() if counter <= 0 and _.isFunction onEmpty
			return

	_.defer callback()

	return callback

# repeats action while condition returns true
exports.while =
asyncWhile = (condition, action) ->
	whilst = ->
		unless condition() then Promise.resolve() 
		else Promise.cast(action()).then(whilst)

	return Promise.resolve().then(whilst)

# basic async object iteration
# if the array is passed, runs immediately
# otherwise returns a function that takes an array
exports.each =
asyncEach = (arr, fn, concurrency = Infinity, map = false) ->
	if _.isFunction(arr) and !fn?
		[fn, arr] = [arr, null]

	workers = 0
	index = 0
	values = []

	process = ->
		return unless index < arr.length and workers < concurrency
		
		workers++
		i = index++
		val = arr[i]

		return Promise
			.try(-> fn.call @, val, i, arr)
			.then (val) ->
				values[i] = val
				workers--
				launch()

	launch = (res) ->
		n = Math.min concurrency - workers, arr.length - index
		promises = _.times n, process
		return Promise.all(promises)

	go = (res) ->
		arr = res if _.isArray res
		return launch().then ->
			if map then values else arr

	return if _.isArray(arr) then go() else go

# async each with a concurrency of 1
exports.eachSeries =
asyncEachSeries = (arr, fn) -> asyncEach arr, fn, 1, false

# similar to each but instead returns a new
# array of values returned from the loop func
exports.map =
asyncMap = (arr, fn) -> asyncEach arr, fn, Infinity, true

# async map with a concurrency of 1
exports.mapSeries =
asyncMapSeries = (arr, fn) -> asyncEach arr, fn, 1, true


# A simple base class for objects that want to handle
# async tasks efficiently.
class AsyncQueue extends EventEmitter

	# adds properties
	# this constructor does not need to be run
	constructor: (fn, concurrency) ->
		unless @ instanceof AsyncQueue
			return new AsyncQueue fn, concurrency

		if _.isNumber(fn) and !concurrency?
			[concurrency, fn] = [fn, null]

		@concurrency = concurrency ? 1
		@_middleware = []
		@_queue = []
		@_workers = 0

		@use(fn) if _.isFunction(fn)

	# add queue middleware
	use: (fn) ->
		unless _.isFunction(fn)
			throw new Error "Expecting function for middleware."

		@_middleware ?= []
		@_middleware.push fn

		return @ # chaining

	# runs a single task through the stack
	run: ->
		args = _.toArray arguments
		series = null

		r = Promise.defer()
		resolve = _.bind r.resolve, r
		reject = _.bind r.reject, r
		
		_.defer => # for guaranteed deferral
			try
				@emit "run:before"
				mw = @_middleware ? []
				index = 0
				isStopped = false

				done = _.once (val) ->
					isStopped = true
					resolve val
					return

				asyncWhile(
					-> not isStopped and index < mw.length
					=> @exec mw[index++], _.clone(args), done
				).then done, reject
			
			catch e
				reject e
				
		return r.promise.then (res) =>
			@emit "run", res
			@emit "run:after"
			return res

	# runs a single task against a single middleware
	# used interally, but left public for outside meddling
	exec: (fn, args, done) ->
		args.push done
		fn.apply @, args

	# adds a single task to the process queue
	_insert: (args, push = true) ->
		task =
			args: if _.isArray(args) then args else [ args ]
			resolver: Promise.defer()

		# push onto the queue
		@_queue ?= []
		@_queue[if push then "push" else "unshift"] task

		@emit "saturated" if @_queue.length is (@concurrency ? 1)
		
		# defer an instance launch
		_.defer => @_process()

		return task.resolver.promise

	push: -> @_insert _.toArray(arguments), true
	unshift: -> @_insert _.toArray(arguments), false

	# starts a single instance that runs until the queue is empty
	_process: ->
		@_workers ?= 0
		@_queue ?= []
		@concurrency ?= 1

		return unless @_queue.length and @_workers < @concurrency
		@_workers++

		task = @_queue.shift()
		r = task.resolver
		resolve = _.bind r.resolve, r
		reject = _.bind r.reject, r

		@emit "empty" if @isEmpty()

		Promise
			.try(=> @run.apply @, task.args)
			.then(resolve, reject)
			.finally =>
				@_workers--
				if @isDrained() then @emit "drain" 
				else @_process()
				return

		return

	# returns # of items in the queue
	length: -> @_queue.length

	# returns # of worker instances
	workers: -> @_workers

	# basic state tests
	isSaturated: -> @_queue.length >= @concurrency
	isEmpty: -> @_queue.length is 0
	isDrained: -> @_queue.length + @_workers is 0

exports.Queue = AsyncQueue