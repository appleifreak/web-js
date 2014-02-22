var coffee;

coffee = require("coffee-script");

module.exports = function(api, options) {
  var _ref;
  api.registerExtension((_ref = options.extensions) != null ? _ref : "coffee");
  return function(text) {
    return coffee.compile(text, options);
  };
};
