_ = require "underscore"
{Minimatch} = require "minimatch"
path = require "path"
fresh = require "fresh"
crypto = require "crypto"

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
			else if Buffer.isBuffer(v) then return v.toString("utf-8")
			else return JSON.stringify(v)

		res.write vals.join(" ") + "\n", "utf-8"
		return

	# dynamic urls
	$resolvePath: do ->
		dirpath = path.dirname path.join "/", req.relative
		base = $conf.get("http.url_base") ? ""
		if base.substr(-1) is "/" then base = base.substr 0, base.length - 1
		(p) -> base + path.resolve dirpath, stripIndex p

exports.basicWrapper = (src, type = "html") ->
	return """module.exports=#{src};
	if (require.main === module) {
		var content = typeof module.exports === "function" ? module.exports.call(this) : module.exports;
		contentType(#{JSON.stringify type});
		$response.set("Content-Length", content.length);
		write(content);
		end();
	}"""

md5 =
exports.md5 = (v) -> crypto.createHash("md5").update(v).digest("hex")

exports.cacheControl = (req, res) ->
	res.set 'ETag', md5 req.method + req.url + req.stat.mtime + req.stat.size
	res.set "Last-Modified", req.stat.mtime.toUTCString()
	
	if fresh req.headers, res._headers
		res.writeHead(304)
		res.end()
		return true

	return false