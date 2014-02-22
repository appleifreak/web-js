# import the instance data
[ "REQUEST", "CONFIG", "MAIN" ].forEach (k) ->
	try global["$#{k.toLowerCase()}"] = JSON.parse(process.env["X_#{k}"])

# some helpers
global.exit = -> process.exit()

global.echo = (args...) ->
	args.forEach (v) -> process.send v

global.end = -> echo null

global.header = (k, val) ->
	echo
		type: "header"
		key: k
		value: val

# and away we go
require($main);