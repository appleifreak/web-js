var AsyncQueue, LoadQueue, Promise, cluster, config, fs, isMatch, theQueue, _;

_ = require("underscore");

cluster = require("cluster");

fs = require("fs");

isMatch = require("./helpers").isMatch;

AsyncQueue = require("./async").AsyncQueue;

Promise = require("bluebird");

_.times($conf.get("threads"), function() {
  return cluster.fork();
});

cluster.on('exit', function(worker, code, signal) {
  var log;
  log = "Worker " + worker.process.pid + " ";
  if (worker.suicide) {
    console.log(log + "committed suicide. Restarting...");
    return cluster.fork();
  } else {
    return console.log(log + ("died (" + (signal || code) + ")."));
  }
});

LoadQueue = (function() {
  function LoadQueue() {
    var _ref;
    this.workers = _.values((_ref = cluster.workers) != null ? _ref : []);
    cluster.on('fork', _.bind(this.addWorker, this));
    cluster.on('disconnect', _.bind(this.removeWorker, this));
  }

  LoadQueue.prototype.addWorker = function(worker) {
    return this.workers.push(worker);
  };

  LoadQueue.prototype.removeWorker = function(worker) {
    return this.workers = _.without(this.workers, worker);
  };

  LoadQueue.prototype.next = function() {
    this.index = (this.index == null) || ++this.index >= this.workers.length ? 0 : this.index;
    return this.workers[this.index];
  };

  return LoadQueue;

})();

theQueue = new LoadQueue;

config = $conf.get("sandbox");

module.exports = function(req, res, next) {
  var $req, dirfiles, done, env, filepath, index, msg, worker;
  filepath = process.cwd() + req.path;
  if (!fs.existsSync(filepath)) {
    return next();
  }
  if (fs.statSync(filepath).isDirectory()) {
    dirfiles = fs.readdirSync(filepath);
    index = _.find(dirfiles, function(f) {
      return _.some(config.index, function(p) {
        return isMatch(f, p);
      });
    });
    if (index == null) {
      return next();
    }
    filepath += index;
  }
  if (!_.some(config.patterns, function(p) {
    return isMatch(filepath, p);
  })) {
    return next();
  }
  $req = _.pick(req, "query", "method", "url", "headers", "ip", "body", "path");
  env = {
    main: filepath,
    request: $req,
    config: $conf.get()
  };
  worker = theQueue.next();
  worker.send(env);
  msg = function(msg) {
    if (!(_.isObject(msg) && (msg.type != null))) {
      return;
    }
    switch (msg.type) {
      case "header":
        return res.set(msg.key, msg.value);
      case "body":
        return res.write(msg.value);
      case "end":
        return done();
    }
  };
  done = function() {
    worker.removeListener("message", msg);
    worker.removeListener("disconnect", done);
    return res.end();
  };
  worker.on("message", msg);
  return worker.on("disconnect", done);
};
