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
		default: require('os').cpus().length - 1
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
			doc: "Filename patterns that will always return 404."
			format: Array
			default: [ "node_modules", ".*", "package.json" ]

	sandbox:
		patterns:
			doc: "Whitelisted glob patterns to run on."
			format: Array
			default: [ "**/*.js" ]
		index:
			doc: "Glob patterns to look for when the requested path is a directory."
			format: Array
			default: [ "index.js", "index.*" ]
		transformers:
			doc: "Modules that transform source code before it is executed."
			format: Object
			default: template: true

conf.loadFile path.resolve process.cwd(), conf.get("config")
conf.validate()