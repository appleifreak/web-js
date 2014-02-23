convict = require 'convict'
path = require 'path'

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

	sandbox:
		patterns:
			doc: "Glob query to determine if sandbox should run at a requested path."
			format: Array
			default: []
		transformers:
			doc: "Modules that transform source code before it is executed."
			format: Object
			default: template: true

conf.loadFile path.resolve process.cwd(), conf.get("config")
conf.validate()