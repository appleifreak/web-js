_ = require "underscore"
{Minimatch} = require "minimatch"
path = require "path"

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

stripIndex =
exports.stripIndex = (filepath) ->
	name = path.basename filepath
	if _.some($conf.get("http.index"), (p) -> isMatch name, p)
		filepath = path.dirname filepath
	return filepath

# generate sandbox context
exports.generate = (req, res, next) ->
	$request: req
	$response: res
	$next: next
	write: _.bind res.write, res
	header: _.bind res.set, res
	statusCode: _.bind res.status, res
	contentType: _.bind res.type, res
	end: _.bind res.end, res

	# prints
	echo: (args...) ->
		vals = args.map (v) ->
			if _.isString(v) or _.isNumber(v) then return v
			else return JSON.stringify(v)

		res.write vals.join(" ") + "\n", "utf-8"
		return

	# dynamic urls
	url: do ->
		dirpath = path.dirname path.join "/", req.relative
		base = $conf.get("http.url_base") ? ""
		if base.substr(-1) is "/" then base = base.substr 0, base.length - 1
		(p) -> base + path.resolve dirpath, stripIndex p
