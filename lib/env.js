var __eval;

__eval = function(src, filepath, ctx) {
  var argNames, fn, vm;
  if (ctx == null) {
    ctx = {};
  }
  vm = __require("vm");
  argNames = Object.keys(ctx);
  src = "(function(" + (argNames.join(",")) + "){" + src + "\n});";
  fn = vm.runInNewContext(src, global, filepath);
  fn.apply({}, argNames.map(function(k) {
    return ctx[k];
  }));
};

(function() {
  var Module, fs, path;
  Module = __require("module");
  fs = __require("fs");
  path = __require("path");
  console.log(Object.keys(Module));
  return console.log(Object.keys(Module.prototype));
})();
