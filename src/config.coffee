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
		format: String
		default: "config.json"
		arg: "config"
		env: "NODE_CONFIG"

	http:
		port:
			doc: "The port to start the HTTP server on."
			format: "int"
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
			doc: "Dynamically constructed urls with be prepended with this value."
			format: String
			default: ""
		allow:
			doc: "Glob query to matching valid request paths. Invalid requests are sent 403 Forbidden."
			format: Array
			default: []

	static:
		enabled:
			doc: "Enabled or disabled the static file server."
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

	sandbox:
		enabled:
			doc: "Enabled or disabled the JavaScript sandbox."
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

configFile = path.resolve process.cwd(), conf.get("config")
if fs.existsSync(configFile)
	conf.loadFile configFile
	conf.set "http.ignore", conf.get("http.ignore").concat conf.get "config"

conf.validate()