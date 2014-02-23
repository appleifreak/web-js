var config, transformers, _;

_ = require("underscore");

module.exports = transformers = [];

config = $conf.get("sandbox.transformers");

_.each(config, function(options, name) {
  var trans, _ref;
  if (!options) {
    return;
  }
  if (!_.isObject(options)) {
    options = {};
  }
  trans = {
    name: name,
    options: options
  };
  trans.fn = require("./" + name)(options);
  trans.extensions = (_ref = options.extensions) != null ? _ref : [];
  return transformers.push(trans);
});
