_ = require "underscore"
{Minimatch} = require "minimatch"

isMatch =
exports.isMatch = (filename, pattern) ->
	if _.isString(pattern) then pattern = new Minimatch pattern
	if pattern instanceof Minimatch then pattern.match filename
	else if _.isRegExp(pattern) then pattern.test filename
	else pattern is filename

exports.isQueryMatch = (filename, rules) ->
	rMatch = (rule, key) ->
		if _.isObject(rule)
			if key is "$or" then return _.any rule, rMatch
			else return _.every rule, rMatch
		return isMatch filename, rule

	return rMatch rules