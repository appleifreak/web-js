_ = require "underscore"

{Minimatch} = require "minimatch"
exports.isMatch = (filename, pattern) ->
	if _.isString(pattern) then pattern = new Minimatch pattern
	if pattern instanceof Minimatch then pattern.match filename
	else if _.isRegExp(pattern) then pattern.test filename
	else pattern is filename