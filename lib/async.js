var AsyncQueue, EventEmitter, Promise, asyncEach, asyncEachSeries, asyncMap, asyncMapSeries, asyncWait, asyncWhile, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require("events").EventEmitter;

_ = require("underscore");

Promise = require("bluebird");

exports.wait = asyncWait = function(onEmpty) {
  var callback, counter;
  counter = 0;
  callback = function(cb) {
    counter++;
    return _.once(function() {
      counter--;
      if (_.isFunction(cb)) {
        cb.apply(this, arguments);
      }
      if (counter <= 0 && _.isFunction(onEmpty)) {
        onEmpty();
      }
    });
  };
  _.defer(callback());
  return callback;
};

exports["while"] = asyncWhile = function(condition, action) {
  var whilst;
  whilst = function() {
    if (!condition()) {
      return Promise.resolve();
    } else {
      return Promise.cast(action()).then(whilst);
    }
  };
  return Promise.resolve().then(whilst);
};

exports.each = asyncEach = function(arr, fn, concurrency, map) {
  var go, index, launch, process, values, workers, _ref;
  if (concurrency == null) {
    concurrency = Infinity;
  }
  if (map == null) {
    map = false;
  }
  if (_.isFunction(arr) && (fn == null)) {
    _ref = [arr, null], fn = _ref[0], arr = _ref[1];
  }
  workers = 0;
  index = 0;
  values = [];
  process = function() {
    var i, val;
    if (!(index < arr.length && workers < concurrency)) {
      return;
    }
    workers++;
    i = index++;
    val = arr[i];
    return Promise["try"](function() {
      return fn.call(this, val, i, arr);
    }).then(function(val) {
      values[i] = val;
      workers--;
      return launch();
    });
  };
  launch = function(res) {
    var n, promises;
    n = Math.min(concurrency - workers, arr.length - index);
    promises = _.times(n, process);
    return Promise.all(promises);
  };
  go = function(res) {
    if (_.isArray(res)) {
      arr = res;
    }
    return launch().then(function() {
      if (map) {
        return values;
      } else {
        return arr;
      }
    });
  };
  if (_.isArray(arr)) {
    return go();
  } else {
    return go;
  }
};

exports.eachSeries = asyncEachSeries = function(arr, fn) {
  return asyncEach(arr, fn, 1, false);
};

exports.map = asyncMap = function(arr, fn) {
  return asyncEach(arr, fn, Infinity, true);
};

exports.mapSeries = asyncMapSeries = function(arr, fn) {
  return asyncEach(arr, fn, 1, true);
};

AsyncQueue = (function(_super) {
  __extends(AsyncQueue, _super);

  function AsyncQueue(fn, concurrency) {
    var _ref;
    if (!(this instanceof AsyncQueue)) {
      return new AsyncQueue(fn, concurrency);
    }
    if (_.isNumber(fn) && (concurrency == null)) {
      _ref = [fn, null], concurrency = _ref[0], fn = _ref[1];
    }
    this.concurrency = concurrency != null ? concurrency : 1;
    this._middleware = [];
    this._queue = [];
    this._workers = 0;
    if (_.isFunction(fn)) {
      this.use(fn);
    }
  }

  AsyncQueue.prototype.use = function(fn) {
    if (!_.isFunction(fn)) {
      throw new Error("Expecting function for middleware.");
    }
    if (this._middleware == null) {
      this._middleware = [];
    }
    this._middleware.push(fn);
    return this;
  };

  AsyncQueue.prototype.run = function() {
    var args, r, reject, resolve, series;
    args = _.toArray(arguments);
    series = null;
    r = Promise.defer();
    resolve = _.bind(r.resolve, r);
    reject = _.bind(r.reject, r);
    _.defer((function(_this) {
      return function() {
        var done, e, index, isStopped, mw, _ref;
        try {
          _this.emit("run:before");
          mw = (_ref = _this._middleware) != null ? _ref : [];
          index = 0;
          isStopped = false;
          done = _.once(function(val) {
            isStopped = true;
            resolve(val);
          });
          return asyncWhile(function() {
            return !isStopped && index < mw.length;
          }, function() {
            return _this.exec(mw[index++], _.clone(args), done);
          }).then(done, reject);
        } catch (_error) {
          e = _error;
          return reject(e);
        }
      };
    })(this));
    return r.promise.then((function(_this) {
      return function(res) {
        _this.emit("run", res);
        _this.emit("run:after");
        return res;
      };
    })(this));
  };

  AsyncQueue.prototype.exec = function(fn, args, done) {
    args.push(done);
    return fn.apply(this, args);
  };

  AsyncQueue.prototype._insert = function(args, push) {
    var task, _ref;
    if (push == null) {
      push = true;
    }
    task = {
      args: _.isArray(args) ? args : [args],
      resolver: Promise.defer()
    };
    if (this._queue == null) {
      this._queue = [];
    }
    this._queue[push ? "push" : "unshift"](task);
    if (this._queue.length === ((_ref = this.concurrency) != null ? _ref : 1)) {
      this.emit("saturated");
    }
    _.defer((function(_this) {
      return function() {
        return _this._process();
      };
    })(this));
    return task.resolver.promise;
  };

  AsyncQueue.prototype.push = function() {
    return this._insert(_.toArray(arguments), true);
  };

  AsyncQueue.prototype.unshift = function() {
    return this._insert(_.toArray(arguments), false);
  };

  AsyncQueue.prototype._process = function() {
    var r, reject, resolve, task;
    if (this._workers == null) {
      this._workers = 0;
    }
    if (this._queue == null) {
      this._queue = [];
    }
    if (this.concurrency == null) {
      this.concurrency = 1;
    }
    if (!(this._queue.length && this._workers < this.concurrency)) {
      return;
    }
    this._workers++;
    task = this._queue.shift();
    r = task.resolver;
    resolve = _.bind(r.resolve, r);
    reject = _.bind(r.reject, r);
    if (this.isEmpty()) {
      this.emit("empty");
    }
    Promise["try"]((function(_this) {
      return function() {
        return _this.run.apply(_this, task.args);
      };
    })(this)).then(resolve, reject)["finally"]((function(_this) {
      return function() {
        _this._workers--;
        if (_this.isDrained()) {
          _this.emit("drain");
        } else {
          _this._process();
        }
      };
    })(this));
  };

  AsyncQueue.prototype.length = function() {
    return this._queue.length;
  };

  AsyncQueue.prototype.workers = function() {
    return this._workers;
  };

  AsyncQueue.prototype.isSaturated = function() {
    return this._queue.length >= this.concurrency;
  };

  AsyncQueue.prototype.isEmpty = function() {
    return this._queue.length === 0;
  };

  AsyncQueue.prototype.isDrained = function() {
    return this._queue.length + this._workers === 0;
  };

  return AsyncQueue;

})(EventEmitter);

exports.Queue = AsyncQueue;
