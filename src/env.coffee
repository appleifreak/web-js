

__eval = (src, filepath, ctx = {}) ->
	vm = __require "vm"
	argNames = Object.keys(ctx)
	src = "(function(#{argNames.join(",")}){#{src}\n});"

	fn = vm.runInNewContext src, global, filepath
	fn.apply {}, argNames.map (k) -> ctx[k]

	return

do ->
	Module = __require "module"
	fs = __require "fs"
	path = __require "path"

	console.log Object.keys Module
	console.log Object.keys Module::