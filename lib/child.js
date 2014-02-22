var __slice = [].slice;

["REQUEST", "CONFIG", "MAIN"].forEach(function(k) {
  try {
    return global["$" + (k.toLowerCase())] = JSON.parse(process.env["X_" + k]);
  } catch (_error) {}
});

global.exit = function() {
  return process.exit();
};

global.echo = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return args.forEach(function(v) {
    return process.send(v);
  });
};

global.end = function() {
  return echo(null);
};

global.header = function(k, val) {
  return echo({
    type: "header",
    key: k,
    value: val
  });
};

require($main);
