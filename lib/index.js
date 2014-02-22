var $conf, cluster;

cluster = require('cluster');

$conf = global.$conf = require("./config");

if (cluster.isMaster) {
  require("./master");
} else {
  require("./child");
}
