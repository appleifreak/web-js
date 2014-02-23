var $conf, cluster, id, threads, w, waiting, _i, _ref;

cluster = require('cluster');

$conf = global.$conf = require("./config");

if (cluster.isMaster) {
  threads = $conf.get("threads");
  for (_i = 0; 0 <= threads ? _i < threads : _i > threads; 0 <= threads ? _i++ : _i--) {
    cluster.fork();
  }
  console.log("Started " + threads + " workers.");
  waiting = threads;
  _ref = cluster.workers;
  for (id in _ref) {
    w = _ref[id];
    w.on("message", function(msg) {
      if (msg === "READY") {
        waiting--;
      }
      if (waiting === 0) {
        return console.log("HTTP server listening on port " + ($conf.get("http.port")) + ".");
      }
    });
  }
  cluster.on('exit', function(worker, code, signal) {
    return console.log("Worker " + worker.process.pid + " died.");
  });
} else {
  require("./init");
}
