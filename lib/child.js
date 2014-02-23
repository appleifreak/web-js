var Module, clean, deleteChildren, fs, runNextTask, running, tasks,
  __slice = [].slice;

fs = require("fs");

Module = require("module");

tasks = [];

running = false;

Module._contextLoad = true;

process.on("message", function(data) {
  tasks.push(data);
  return runNextTask();
});

global.echo = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return args.forEach(function(v) {
    return process.send({
      type: "body",
      value: v
    });
  });
};

global.end = function() {
  process.send({
    type: "end",
    value: true
  });
  return clean();
};

global.header = function(k, val) {
  return process.send({
    type: "header",
    key: k,
    value: val
  });
};

deleteChildren = function(mod) {
  mod.children.slice(0).forEach(function(m) {
    console.log(m.id);
    if (m.children.length) {
      deleteChildren(m);
    }
    return delete Module._cache[m.id];
  });
  mod.children = [];
};

clean = function() {
  running = false;
  console.log(Object.keys(Module._cache).length);
  deleteChildren(module);
  delete Module._cache[module.id];
  console.log(Object.keys(Module._cache).length);
  return runNextTask();
};

runNextTask = function() {
  if (running) {
    return;
  }
  running = true;
  return process.nextTick(function() {
    var filename, task;
    task = tasks.shift();
    if (task == null) {
      return;
    }
    filename = task.main;
    return require(filename);
  });
};
