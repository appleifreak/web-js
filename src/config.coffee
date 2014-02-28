convict = require 'convict'
path = require 'path'
fs = require 'fs'

module.exports =
conf = convict
	env:
		doc: "Node environment."
		format: [ "development", "production" ]
		default: "development"
		arg: "env"
		env: "NODE_ENV"
	threads:
		doc: "The number of threads to launch on."
		format: "int"
		default: require('os').cpus().length
		arg: "threads"
		env: "NODE_THREADS"
	config:
		doc: "JSON configuration file path relative to the current working directory."
		format: Array
		default: [ "config.json", "config.js" ]
		arg: "config"
		env: "NODE_CONFIG"
	cwd:
		doc: "The current working directory."
		format: String
		default: process.cwd()
		arg: "cwd"

	http:
		port:
			doc: "The port to start the HTTP server on."
			format: "port"
			default: 3000
			arg: "port"
			env: "PORT"
		ignore:
			doc: "Glob patterns for filenames that will always return 404."
			format: Array
			default: [ "node_modules", ".*", "package.json" ]
		index:
			doc: "Glob patterns for a filename to look for when the requested path is a directory."
			format: Array
			default: [ "index.js", "index.*" ]
		url_base:
			doc: "Dynamically constructed urls will be prepended with this value."
			format: String
			default: ""
		allow:
			doc: "Glob query to matching valid request paths. Invalid requests are sent 403 Forbidden."
			format: Array
			default: []

	static:
		enabled:
			doc: "Enable or disable the static file server."
			format: Boolean
			default: true
		allow:
			doc: "Glob query matching valid file paths to determine which files should be served statically."
			format: Array
			default: []
		mime_types:
			doc: "Mime types mapped to extensions."
			format: Object
			default: {}
		directory:
			doc: "If the request path is a directory, an html list of files will be shown."
			format: Boolean
			default: true
		headers:
			doc: "Additional headers to add onto static requests."
			format: Object
			default:
				"Cache-Control": "max-age=86400"

	sandbox:
		enabled:
			doc: "Enable or disable the JavaScript sandbox."
			format: Boolean
			default: true
		allow:
			doc: "Glob query matching valid file paths to determine which files should be sandboxed."
			format: Array
			default: []
		transformers:
			doc: "Modules that transform source code before it is executed."
			format: Object
			default: template: true

# resolve the cwd
cwd = path.resolve conf.get("cwd")

# load the config file
conf.get("config").some (filename) ->
	configFile = path.resolve cwd, filename
	return unless fs.existsSync(configFile)

	if path.extname(configFile) is ".json" then conf.loadFile(configFile)
	else conf.load require configFile
	
	allow = conf.get("http.allow")
	allow.push "!" + path.relative cwd, configFile
	conf.set "http.allow", allow
	return true

# make the cwd permanent
conf.set "cwd", cwd

# validate and go
conf.validate()