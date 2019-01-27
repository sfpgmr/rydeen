(function () {
'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var Tween = createCommonjsModule(function (module, exports) {
/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

var TWEEN = TWEEN || (function () {

	var _tweens = [];

	return {

		getAll: function () {

			return _tweens;

		},

		removeAll: function () {

			_tweens = [];

		},

		add: function (tween) {

			_tweens.push(tween);

		},

		remove: function (tween) {

			var i = _tweens.indexOf(tween);

			if (i !== -1) {
				_tweens.splice(i, 1);
			}

		},

		update: function (time, preserve) {

			if (_tweens.length === 0) {
				return false;
			}

			var i = 0;

			time = time !== undefined ? time : TWEEN.now();

			while (i < _tweens.length) {

				if (_tweens[i].update(time) || preserve) {
					i++;
				} else {
					_tweens.splice(i, 1);
				}

			}

			return true;

		}
	};

})();


// Include a performance.now polyfill.
// In node.js, use process.hrtime.
if (typeof (window) === 'undefined' && typeof (process) !== 'undefined') {
	TWEEN.now = function () {
		var time = process.hrtime();

		// Convert [seconds, nanoseconds] to milliseconds.
		return time[0] * 1000 + time[1] / 1000000;
	};
}
// In a browser, use window.performance.now if it is available.
else if (typeof (window) !== 'undefined' &&
         window.performance !== undefined &&
		 window.performance.now !== undefined) {
	// This must be bound, because directly assigning this function
	// leads to an invocation exception in Chrome.
	TWEEN.now = window.performance.now.bind(window.performance);
}
// Use Date.now if it is available.
else if (Date.now !== undefined) {
	TWEEN.now = Date.now;
}
// Otherwise, use 'new Date().getTime()'.
else {
	TWEEN.now = function () {
		return new Date().getTime();
	};
}


TWEEN.Tween = function (object) {

	var _object = object;
	var _valuesStart = {};
	var _valuesEnd = {};
	var _valuesStartRepeat = {};
	var _duration = 1000;
	var _repeat = 0;
	var _repeatDelayTime;
	var _yoyo = false;
	var _isPlaying = false;
	var _reversed = false;
	var _delayTime = 0;
	var _startTime = null;
	var _easingFunction = TWEEN.Easing.Linear.None;
	var _interpolationFunction = TWEEN.Interpolation.Linear;
	var _chainedTweens = [];
	var _onStartCallback = null;
	var _onStartCallbackFired = false;
	var _onUpdateCallback = null;
	var _onCompleteCallback = null;
	var _onStopCallback = null;

	this.to = function (properties, duration) {

		_valuesEnd = properties;

		if (duration !== undefined) {
			_duration = duration;
		}

		return this;

	};

	this.start = function (time) {

		TWEEN.add(this);

		_isPlaying = true;

		_onStartCallbackFired = false;

		_startTime = time !== undefined ? time : TWEEN.now();
		_startTime += _delayTime;

		for (var property in _valuesEnd) {

			// Check if an Array was provided as property value
			if (_valuesEnd[property] instanceof Array) {

				if (_valuesEnd[property].length === 0) {
					continue;
				}

				// Create a local copy of the Array with the start value at the front
				_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

			}

			// If `to()` specifies a property that doesn't exist in the source object,
			// we should not set that property in the object
			if (_object[property] === undefined) {
				continue;
			}

			// Save the starting value.
			_valuesStart[property] = _object[property];

			if ((_valuesStart[property] instanceof Array) === false) {
				_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
			}

			_valuesStartRepeat[property] = _valuesStart[property] || 0;

		}

		return this;

	};

	this.stop = function () {

		if (!_isPlaying) {
			return this;
		}

		TWEEN.remove(this);
		_isPlaying = false;

		if (_onStopCallback !== null) {
			_onStopCallback.call(_object, _object);
		}

		this.stopChainedTweens();
		return this;

	};

	this.end = function () {

		this.update(_startTime + _duration);
		return this;

	};

	this.stopChainedTweens = function () {

		for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
			_chainedTweens[i].stop();
		}

	};

	this.delay = function (amount) {

		_delayTime = amount;
		return this;

	};

	this.repeat = function (times) {

		_repeat = times;
		return this;

	};

	this.repeatDelay = function (amount) {

		_repeatDelayTime = amount;
		return this;

	};

	this.yoyo = function (yoyo) {

		_yoyo = yoyo;
		return this;

	};


	this.easing = function (easing) {

		_easingFunction = easing;
		return this;

	};

	this.interpolation = function (interpolation) {

		_interpolationFunction = interpolation;
		return this;

	};

	this.chain = function () {

		_chainedTweens = arguments;
		return this;

	};

	this.onStart = function (callback) {

		_onStartCallback = callback;
		return this;

	};

	this.onUpdate = function (callback) {

		_onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function (callback) {

		_onCompleteCallback = callback;
		return this;

	};

	this.onStop = function (callback) {

		_onStopCallback = callback;
		return this;

	};

	this.update = function (time) {

		var property;
		var elapsed;
		var value;

		if (time < _startTime) {
			return true;
		}

		if (_onStartCallbackFired === false) {

			if (_onStartCallback !== null) {
				_onStartCallback.call(_object, _object);
			}

			_onStartCallbackFired = true;
		}

		elapsed = (time - _startTime) / _duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		value = _easingFunction(elapsed);

		for (property in _valuesEnd) {

			// Don't update properties that do not exist in the source object
			if (_valuesStart[property] === undefined) {
				continue;
			}

			var start = _valuesStart[property] || 0;
			var end = _valuesEnd[property];

			if (end instanceof Array) {

				_object[property] = _interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {

					if (end.charAt(0) === '+' || end.charAt(0) === '-') {
						end = start + parseFloat(end);
					} else {
						end = parseFloat(end);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					_object[property] = start + (end - start) * value;
				}

			}

		}

		if (_onUpdateCallback !== null) {
			_onUpdateCallback.call(_object, value);
		}

		if (elapsed === 1) {

			if (_repeat > 0) {

				if (isFinite(_repeat)) {
					_repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in _valuesStartRepeat) {

					if (typeof (_valuesEnd[property]) === 'string') {
						_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property]);
					}

					if (_yoyo) {
						var tmp = _valuesStartRepeat[property];

						_valuesStartRepeat[property] = _valuesEnd[property];
						_valuesEnd[property] = tmp;
					}

					_valuesStart[property] = _valuesStartRepeat[property];

				}

				if (_yoyo) {
					_reversed = !_reversed;
				}

				if (_repeatDelayTime !== undefined) {
					_startTime = time + _repeatDelayTime;
				} else {
					_startTime = time + _delayTime;
				}

				return true;

			} else {

				if (_onCompleteCallback !== null) {

					_onCompleteCallback.call(_object, _object);
				}

				for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					_chainedTweens[i].start(_startTime + _duration);
				}

				return false;

			}

		}

		return true;

	};

};


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);

		},

		Out: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			k *= 2;

			if (k < 1) {
				return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
			}

			return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// UMD (Universal Module Definition)
(function (root) {

	if (typeof define === 'function' && define.amd) {

		// AMD
		define([], function () {
			return TWEEN;
		});

	} else if (typeof module !== 'undefined' && typeof exports === 'object') {

		// Node.js
		module.exports = TWEEN;

	} else if (root !== undefined) {

		// Global variable
		root.TWEEN = TWEEN;

	}

})(commonjsGlobal);
});

var index = createCommonjsModule(function (module) {
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}
});

class TimeLine extends index
{
  constructor(events = []){
    super();
    this.index = 0;
    this.events = events;
    this.events.length > 0 && this.events.sort((a,b)=>a.time - b.time);
  }

  add(time,func){
    this.events.push({time:time,func:func});
    this.events.sort((a,b)=>a.time - b.time);
  }

  update(time){
    while(this.index < this.events.length && time >= this.events[this.index].time){
      this.events[this.index].func(time);
      this.index += 1;
    }
    if(this.index >= this.events.length){
      this.emit('end');
    }
  }

  skip(time){
    while(this.index < this.events.length && time > this.events[this.index].time){
      this.index += 1;
    }
  }
}

class QueryString {  
  parse(text, sep, eq, isDecode) {
    text = text || location.search.substr(1);
    sep = sep || '&';
    eq = eq || '=';
    var decode = (isDecode) ? decodeURIComponent : function(a) { return a; };
    return text.split(sep).reduce(function(obj, v) {
      var pair = v.split(eq);
      obj[pair[0]] = decode(pair[1]);
      return obj;
    }, {});
  }
  stringify(value, sep, eq, isEncode) {
    sep = sep || '&';
    eq = eq || '=';
    var encode = (isEncode) ? encodeURIComponent : function(a) { return a; };
    return Object.keys(value).map(function(key) {
      return key + eq + encode(value[key]);
    }).join(sep);
  }
}

/**
 * @author SFPGMR
 */
// Shader Sampleより拝借
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html

/**
 * @author SFPGMR
 */
 // Shader Sampleより拝借
 // https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
let vertexShader = 
`
varying vec2 vUv;
void main()	{
		vUv = uv;
    gl_Position = vec4( position, 1.0 );
  }
`;
  let fragmentShader = 
`
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;
void main()	{

  vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
  vec4 c1,c2;
  float a = time*40.0;
  float d,e,f,g=1.0/40.0,h,i,r,q;
  float c2v;
  e=400.0*(p.x*0.5+0.5);
  f=400.0*(p.y*0.5+0.5);
  i=200.0+sin(e*g+a/150.0)*20.0;
  d=200.0+cos(f*g/2.0)*18.0+cos(e*g)*7.0;
  r=sqrt(pow(abs(i-e),2.0)+pow(abs(d-f),2.0));
  q=f/r;
  e=(r*cos(q))-a/2.0;f=(r*sin(q))-a/2.0;
  d=sin(e*g)*176.0+sin(e*g)*164.0+r;
  h=((f+d)+a/2.0)*g;
  i=cos(h+r*p.x/1.3)*(e+e+a)+cos(q*g*6.0)*(r+h/3.0);
  h=sin(f*g)*144.0-sin(e*g)*212.0*p.x;
  h=(h+(f-e)*q+sin(r-(a+h)/7.0)*10.0+i/4.0)*g;
  i+=cos(h*2.3*sin(a/350.0-q))*184.0*sin(q-(r*4.3+a/12.0)*g)+tan(r*g+h)*184.0*cos(r*g+h);
  i=mod(i/5.6,256.0)/64.0;
  if(i<0.0) i+=4.0;
  if(i>=2.0) i=4.0-i;
  d=r/350.0;
  d+=sin(d*d*8.0)*0.52;
  f=(sin(a*g)+1.0)/2.0;
  c2 = texture2D( tDiffuse, vUv );
  c1 = vec4(vec3(f*i/1.6,i/2.0+d/13.0,i)*d*p.x+vec3(i/1.3+d/8.0,i/2.0+d/18.0,i)*d*(1.0-p.x),1.0);
  float alpha = c2.w;
  c2.w = 1.0;
  if(length(vec3(c2.x,c2.y,c2.z)) > 0.0 ) 
  {
    gl_FragColor = c2;
  } else {
    gl_FragColor = vec4(vec3(c1.x,c1.y,c1.z)* 0.17,1.0);
  }
}
`;

//     let geometry = new THREE.PlaneBufferGeometry( 1920, 1080 );
let uniforms = {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2() },
			time:       { value: 0.0 }
    };
//     uniforms.resolution.value.x = WIDTH;
//     uniforms.resolution.value.y = HEIGHT;
//     let material = new THREE.ShaderMaterial( {
//       uniforms: uniforms,
//       vertexShader: vertShader,
//       fragmentShader: fragShader
//     } );
//     let mesh = new THREE.Mesh( geometry, material );
//     mesh.position.z = -5000;
//     scene.add( mesh );
//   }

class SFShaderPass extends THREE.Pass {
	constructor(width,height){
		super();

		this.uniforms = THREE.UniformsUtils.clone( uniforms );
		this.uniforms.resolution.value.x = width;
		this.uniforms.resolution.value.y = height;
		this.material = new THREE.ShaderMaterial( {
			uniforms: this.uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		} );

		this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1 );
		this.scene  = new THREE.Scene();

		this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
		this.scene.add( this.quad );

	}

  setSize(width,height){
		this.uniforms.resolution.value.x = width;
		this.uniforms.resolution.value.y = height;
  }

	render(renderer, writeBuffer, readBuffer, delta, maskActive){
		this.uniforms[ "tDiffuse" ].value = readBuffer.texture;
		this.quad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera );

		} else {

			renderer.render( this.scene, this.camera, writeBuffer, this.clear );

		}

	}
}

/**
 * @author yomboprime https://github.com/yomboprime
 *
 * GPUComputationRenderer, based on SimulationRenderer by zz85
 *
 * The GPUComputationRenderer uses the concept of variables. These variables are RGBA float textures that hold 4 floats
 * for each compute element (texel)
 *
 * Each variable has a fragment shader that defines the computation made to obtain the variable in question.
 * You can use as many variables you need, and make dependencies so you can use textures of other variables in the shader
 * (the sampler uniforms are added automatically) Most of the variables will need themselves as dependency.
 *
 * The renderer has actually two render targets per variable, to make ping-pong. Textures from the current frame are used
 * as inputs to render the textures of the next frame.
 *
 * The render targets of the variables can be used as input textures for your visualization shaders.
 *
 * Variable names should be valid identifiers and should not collide with THREE GLSL used identifiers.
 * a common approach could be to use 'texture' prefixing the variable name; i.e texturePosition, textureVelocity...
 *
 * The size of the computation (sizeX * sizeY) is defined as 'resolution' automatically in the shader. For example:
 * #DEFINE resolution vec2( 1024.0, 1024.0 )
 *
 * -------------
 *
 * Basic use:
 *
 * // Initialization...
 *
 * // Create computation renderer
 * var gpuCompute = new GPUComputationRenderer( 1024, 1024, renderer );
 *
 * // Create initial state float textures
 * var pos0 = gpuCompute.createTexture();
 * var vel0 = gpuCompute.createTexture();
 * // and fill in here the texture data...
 *
 * // Add texture variables
 * var velVar = gpuCompute.addVariable( "textureVelocity", fragmentShaderVel, pos0 );
 * var posVar = gpuCompute.addVariable( "texturePosition", fragmentShaderPos, vel0 );
 *
 * // Add variable dependencies
 * gpuCompute.setVariableDependencies( velVar, [ velVar, posVar ] );
 * gpuCompute.setVariableDependencies( posVar, [ velVar, posVar ] );
 *
 * // Add custom uniforms
 * velVar.material.uniforms.time = { value: 0.0 };
 *
 * // Check for completeness
 * var error = gpuCompute.init();
 * if ( error !== null ) {
 *		console.error( error );
  * }
 *
 *
 * // In each frame...
 *
 * // Compute!
 * gpuCompute.compute();
 *
 * // Update texture uniforms in your visualization materials with the gpu renderer output
 * myMaterial.uniforms.myTexture.value = gpuCompute.getCurrentRenderTarget( posVar ).texture;
 *
 * // Do your rendering
 * renderer.render( myScene, myCamera );
 *
 * -------------
 *
 * Also, you can use utility functions to create ShaderMaterial and perform computations (rendering between textures)
 * Note that the shaders can have multiple input textures.
 *
 * var myFilter1 = gpuCompute.createShaderMaterial( myFilterFragmentShader1, { theTexture: { value: null } } );
 * var myFilter2 = gpuCompute.createShaderMaterial( myFilterFragmentShader2, { theTexture: { value: null } } );
 *
 * var inputTexture = gpuCompute.createTexture();
 *
 * // Fill in here inputTexture...
 *
 * myFilter1.uniforms.theTexture.value = inputTexture;
 *
 * var myRenderTarget = gpuCompute.createRenderTarget();
 * myFilter2.uniforms.theTexture.value = myRenderTarget.texture;
 *
 * var outputRenderTarget = gpuCompute.createRenderTarget();
 *
 * // Now use the output texture where you want:
 * myMaterial.uniforms.map.value = outputRenderTarget.texture;
 *
 * // And compute each frame, before rendering to screen:
 * gpuCompute.doRenderTarget( myFilter1, myRenderTarget );
 * gpuCompute.doRenderTarget( myFilter2, outputRenderTarget );
 * 
 *
 *
 * @param {int} sizeX Computation problem size is always 2d: sizeX * sizeY elements.
 * @param {int} sizeY Computation problem size is always 2d: sizeX * sizeY elements.
 * @param {WebGLRenderer} renderer The renderer
  */
class GPUComputationRenderer{
	constructor( sizeX, sizeY, renderer ) {

	this.renderer = renderer;
	this.sizeX = sizeX;
	this.sizeY = sizeY;

	this.variables = [];

	this.currentTextureIndex = 0;

	this.scene = new THREE.Scene();

	this.camera = new THREE.Camera();
	this.camera.position.z = 1;

	this.passThruUniforms = {
		texture: { value: null }
	};

	this.passThruShader = this.createShaderMaterial( this.getPassThroughFragmentShader(), this.passThruUniforms );

	this.mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), this.passThruShader );
	this.scene.add( this.mesh );
	}


	addVariable( variableName, computeFragmentShader, initialValueTexture ) {

		var material = this.createShaderMaterial( computeFragmentShader );

		var variable = {
			name: variableName,
			initialValueTexture: initialValueTexture,
			material: material,
			dependencies: null,
			renderTargets: [],
			wrapS: null,
			wrapT: null,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter
		};

		this.variables.push( variable );

		return variable;
		
	}

	setVariableDependencies( variable, dependencies ) {

		variable.dependencies = dependencies;

	};

	init() {

		let sizeX = this.sizeX;
		let sizeY = this.sizeY;

		if ( ! this.renderer.extensions.get( "OES_texture_float" ) ) {

			return "No OES_texture_float support for float textures.";

		}

		if ( this.renderer.capabilities.maxVertexTextures === 0 ) {

			return "No support for vertex shader textures.";

		}

		for ( var i = 0; i < this.variables.length; i++ ) {

			var variable = this.variables[ i ];

			// Creates rendertargets and initialize them with input texture
			variable.renderTargets[ 0 ] = this.createRenderTarget( sizeX, sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter );
			variable.renderTargets[ 1 ] = this.createRenderTarget( sizeX, sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter );
			this.renderTexture( variable.initialValueTexture, variable.renderTargets[ 0 ] );
			this.renderTexture( variable.initialValueTexture, variable.renderTargets[ 1 ] );

			// Adds dependencies uniforms to the ShaderMaterial
			var material = variable.material;
			var uniforms = material.uniforms;
			if ( variable.dependencies !== null ) {

				for ( var d = 0; d < variable.dependencies.length; d++ ) {

					var depVar = variable.dependencies[ d ];

					if ( depVar.name !== variable.name ) {

						// Checks if variable exists
						var found = false;
						for ( var j = 0; j < this.variables.length; j++ ) {

							if ( depVar.name === this.variables[ j ].name ) {
								found = true;
								break;
							}

						}
						if ( ! found ) {
							return "Variable dependency not found. Variable=" + variable.name + ", dependency=" + depVar.name;
						}

					}

					uniforms[ depVar.name ] = { value: null };

					material.fragmentShader = "\nuniform sampler2D " + depVar.name + ";\n" + material.fragmentShader;

				}
			}
		}

		this.currentTextureIndex = 0;

		return null;

	};

	compute() {

		var currentTextureIndex = this.currentTextureIndex;
		var nextTextureIndex = this.currentTextureIndex === 0 ? 1 : 0;

		for ( var i = 0, il = this.variables.length; i < il; i++ ) {

			var variable = this.variables[ i ];

			// Sets texture dependencies uniforms
			if ( variable.dependencies !== null ) {

				var uniforms = variable.material.uniforms;
				for ( var d = 0, dl = variable.dependencies.length; d < dl; d++ ) {

					var depVar = variable.dependencies[ d ];

					uniforms[ depVar.name ].value = depVar.renderTargets[ currentTextureIndex ].texture;

				}

			}

			// Performs the computation for this variable
			this.doRenderTarget( variable.material, variable.renderTargets[ nextTextureIndex ] );

		}

		this.currentTextureIndex = nextTextureIndex;
	}

	getCurrentRenderTarget( variable ) {

		return variable.renderTargets[ this.currentTextureIndex ];

	};

	getAlternateRenderTarget( variable ) {

		return variable.renderTargets[ this.currentTextureIndex === 0 ? 1 : 0 ];

	}

	addResolutionDefine( materialShader ) {

		materialShader.defines.resolution = 'vec2( ' + this.sizeX.toFixed( 1 ) + ', ' + this.sizeY.toFixed( 1 ) + " )";

	};


	// The following functions can be used to compute things manually

	createShaderMaterial( computeFragmentShader, uniforms ) {

		uniforms = uniforms || {};

		var material = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: this.getPassThroughVertexShader(),
			fragmentShader: computeFragmentShader
		} );

		this.addResolutionDefine( material );

		return material;
	};

	createRenderTarget( sizeXTexture, sizeYTexture, wrapS, wrapT, minFilter, magFilter ) {

		sizeXTexture = sizeXTexture || this.sizeX;
		sizeYTexture = sizeYTexture || this.sizeY;

		wrapS = wrapS || THREE.ClampToEdgeWrapping;
		wrapT = wrapT || THREE.ClampToEdgeWrapping;

		minFilter = minFilter || THREE.NearestFilter;
		magFilter = magFilter || THREE.NearestFilter;

		var renderTarget = new THREE.WebGLRenderTarget( sizeXTexture, sizeYTexture, {
			wrapS: wrapS,
			wrapT: wrapT,
			minFilter: minFilter,
			magFilter: magFilter,
			format: THREE.RGBAFormat,
			type: ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType,
			stencilBuffer: false
		} );

		return renderTarget;

	}

	createTexture( sizeXTexture, sizeYTexture ) {

		sizeXTexture = sizeXTexture || this.sizeX;
		sizeYTexture = sizeYTexture || this.sizeY;

		let a = new Float32Array( sizeXTexture * sizeYTexture * 4 );
		let texture = new THREE.DataTexture( a, sizeXTexture, sizeYTexture, THREE.RGBAFormat, THREE.FloatType );
		texture.needsUpdate = true;

		return texture;

	};


	renderTexture( input, output ) {

		// Takes a texture, and render out in rendertarget
		// input = Texture
		// output = RenderTarget

		this.passThruUniforms.texture.value = input;

		this.doRenderTarget( this.passThruShader, output);

		this.passThruUniforms.texture.value = null;

	};

	doRenderTarget( material, output ) {

		this.mesh.material = material;
		this.renderer.render( this.scene, this.camera, output );
		this.mesh.material = this.passThruShader;

	};

	// Shaders

	getPassThroughVertexShader() {

		return `
		void main(){
			gl_Position = vec4( position, 1.0 );
		}
		`;	
	}

	getPassThroughFragmentShader() {
		return `
		    uniform sampler2D texture;
				void main() {
					vec2 uv = gl_FragCoord.xy / resolution.xy;
					gl_FragColor = texture2D( texture, uv );
				}
				`;
	}

}

/**
 * @author SFPGMR
 */
 // Shader Sampleより拝借
 // https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
const fragmentShaderPosition = `
uniform float time;
uniform float delta;
void main()	{
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tmpPos = texture2D( texturePosition, uv );
  vec3 position = tmpPos.xyz;
  vec3 velocity = texture2D( textureVelocity, uv ).xyz;
  float phase = tmpPos.w;
  phase = mod( ( phase + delta +
    length( velocity.xz ) * delta * 3. +
    max( velocity.y, 0.0 ) * delta * 6. ), 62.83 );
  gl_FragColor = vec4( position + velocity * delta * 15. , phase );
}
`;

const fragmentShaderVelocity = `
uniform float time;
uniform float testing;
uniform float delta; // about 0.016
uniform float seperationDistance; // 20
uniform float alignmentDistance; // 40
uniform float cohesionDistance; //
uniform float freedomFactor;
uniform vec3 predator;
const float width = resolution.x;
const float height = resolution.y;
const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;
// const float VISION = PI * 0.55;
float zoneRadius = 40.0;
float zoneRadiusSquared = 1600.0;
float separationThresh = 0.45;
float alignmentThresh = 0.65;
const float UPPER_BOUNDS = BOUNDS;
const float LOWER_BOUNDS = -UPPER_BOUNDS;
const float SPEED_LIMIT = 9.0;
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
void main() {
  zoneRadius = seperationDistance + alignmentDistance + cohesionDistance;
  separationThresh = seperationDistance / zoneRadius;
  alignmentThresh = ( seperationDistance + alignmentDistance ) / zoneRadius;
  zoneRadiusSquared = zoneRadius * zoneRadius;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 birdPosition, birdVelocity;
  vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
  vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;
  float dist;
  vec3 dir; // direction
  float distSquared;
  float seperationSquared = seperationDistance * seperationDistance;
  float cohesionSquared = cohesionDistance * cohesionDistance;
  float f;
  float percent;
  vec3 velocity = selfVelocity;
  float limit = SPEED_LIMIT;
  dir = predator * UPPER_BOUNDS - selfPosition;
  dir.z = 0.;
  // dir.z *= 0.6;
  dist = length( dir );
  distSquared = dist * dist;
  float preyRadius = 150.0;
  float preyRadiusSq = preyRadius * preyRadius;
  // move birds away from predator
  if (dist < preyRadius) {
    f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
    velocity += normalize( dir ) * f;
    limit += 5.0;
  }
  // if (testing == 0.0) {}
  // if ( rand( uv + time ) < freedomFactor ) {}
  // Attract flocks to the center
  vec3 central = vec3( 0., 0., 0. );
  dir = selfPosition - central;
  dist = length( dir );
  dir.y *= 2.5;
  velocity -= normalize( dir ) * delta * 5.;
  for (float y=0.0;y<height;y++) {
    for (float x=0.0;x<width;x++) {
      vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
      birdPosition = texture2D( texturePosition, ref ).xyz;
      dir = birdPosition - selfPosition;
      dist = length(dir);
      if (dist < 0.0001) continue;
      distSquared = dist * dist;
      if (distSquared > zoneRadiusSquared ) continue;
      percent = distSquared / zoneRadiusSquared;
      if ( percent < separationThresh ) { // low
        // Separation - Move apart for comfort
        f = (separationThresh / percent - 1.0) * delta;
        velocity -= normalize(dir) * f;
      } else if ( percent < alignmentThresh ) { // high
        // Alignment - fly the same direction
        float threshDelta = alignmentThresh - separationThresh;
        float adjustedPercent = ( percent - separationThresh ) / threshDelta;
        birdVelocity = texture2D( textureVelocity, ref ).xyz;
        f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
        velocity += normalize(birdVelocity) * f;
      } else {
        // Attraction / Cohesion - move closer
        float threshDelta = 1.0 - alignmentThresh;
        float adjustedPercent = ( percent - alignmentThresh ) / threshDelta;
        f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;
        velocity += normalize(dir) * f;
      }
    }
  }
  // this make tends to fly around than down or up
  // if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);
  // Speed Limits
  if ( length( velocity ) > limit ) {
    velocity = normalize( velocity ) * limit;
  }
  gl_FragColor = vec4( velocity, 1.0 );
}
`;

const birdsVS = `
attribute vec2 reference;
attribute float birdVertex;
attribute vec3 birdColor;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
varying vec4 vColor;
varying float z;
uniform float time;
void main() {
  vec4 tmpPos = texture2D( texturePosition, reference );
  vec3 pos = tmpPos.xyz;
  vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);
  vec3 newPosition = position;
  if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
    // flap wings
    newPosition.y = sin( tmpPos.w ) * 5.;
  }
  newPosition = mat3( modelMatrix ) * newPosition;
  velocity.z *= -1.;
  float xz = length( velocity.xz );
  float xyz = 1.;
  float x = sqrt( 1. - velocity.y * velocity.y );
  float cosry = velocity.x / xz;
  float sinry = velocity.z / xz;
  float cosrz = x / xyz;
  float sinrz = velocity.y / xyz;
  mat3 maty =  mat3(
    cosry, 0, -sinry,
    0    , 1, 0     ,
    sinry, 0, cosry
  );
  mat3 matz =  mat3(
    cosrz , sinrz, 0,
    -sinrz, cosrz, 0,
    0     , 0    , 1
  );
  newPosition =  maty * matz * newPosition;
  newPosition += pos;
  z = newPosition.z;
  vColor = vec4( birdColor, 1.0 );
  gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );
}
`;

const birdsFS = `
varying vec4 vColor;
varying float z;
uniform vec3 color;
void main() {
  // Fake colors for now
  // float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
//  gl_FragColor = vec4( z2, z2, z2, 1. );
  gl_FragColor = vColor;
}
`;

/* TEXTURE WIDTH FOR SIMULATION */
var WIDTH = 64;
var BIRDS = WIDTH * WIDTH;
// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
class BirdGeometry extends THREE.BufferGeometry {
  constructor(){
    super();
    this.last = 0;
    var triangles = BIRDS * 3;
    var points = triangles * 3;
    var vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
    var birdColors = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
    var references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );
    var birdVertex = new THREE.BufferAttribute( new Float32Array( points ), 1 );
    this.addAttribute( 'position', vertices );
    this.addAttribute( 'birdColor', birdColors );
    this.addAttribute( 'reference', references );
    this.addAttribute( 'birdVertex', birdVertex );
    // this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 );
    var v = 0;
    function verts_push() {
      for (var i=0; i < arguments.length; i++) {
        vertices.array[v++] = arguments[i];
      }
    }
    var wingsSpan = 20;
    for (var f = 0; f<BIRDS; f++ ) {
      // Body
      verts_push(
        0, -0, -20,
        0, 4, -20,
        0, 0, 30
      );
      // Left Wing
      verts_push(
        0, 0, -15,
        -wingsSpan, 0, 0,
        0, 0, 15
      );
      // Right Wing
      verts_push(
        0, 0, 15,
        wingsSpan, 0, 0,
        0, 0, -15
      );
    }
    for( var v = 0; v < triangles * 3; v++ ) {
      var i = ~~(v / 3);
      var x = (i % WIDTH) / WIDTH;
      var y = ~~(i / WIDTH) / WIDTH;
      var c = new THREE.Color(
        0x666666 +
        ~~(v / 9) / BIRDS * 0x888888
      );
      birdColors.array[ v * 3 + 0 ] = c.r;
      birdColors.array[ v * 3 + 1 ] = c.g;
      birdColors.array[ v * 3 + 2 ] = c.b;
      references.array[ v * 2     ] = x;
      references.array[ v * 2 + 1 ] = y;
      birdVertex.array[ v         ] = v % 9;
    }
    this.scale( 0.2, 0.2, 0.2 );
  }
}

class SFGpGpuPass extends THREE.Pass {
	constructor(width,height,renderer){
		  super();
      this.renderer = renderer;
      this.width = width;
      this.height = height;
			this.windowHalfX = width / 2;
			this.windowHalfY = height / 2;
			this.BOUNDS = 800, this.BOUNDS_HALF = this.BOUNDS / 2;
	
			this.gpuCompute = null;
			this.velocityVariable = null;
			this.positionVariable = null;
			this.positionUniforms = null;
			this.velocityUniforms = null;
			this.birdUniforms = null;
			this.camera = new THREE.PerspectiveCamera( 75, width / height, 1, 3000 );
			this.camera.position.z = 350;
			this.scene = new THREE.Scene();
			this.scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );
      this.initComputeRenderer();
      this.initBirds();
      this.init = Promise.resolve();

      var parameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
      };
      var size = renderer.getSize();
      this.renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, parameters );
      this.mergeUniforms =  {
        tDiffuse: { value: null },
        tDiffuse1: { value: null },
        opacity: { value: 1.0 }
      };

      let mergeVertexShader =
      `
varying vec2 vUv;
void main()	{
		vUv = uv;
    gl_Position = vec4( position, 1.0 );
  }
`;
      let mergeFragmentShader =
      `
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse1;
uniform float opacity; 
varying vec2 vUv;
void main()	{
  vec4 c = texture2D( tDiffuse, vUv );
  vec4 c1 = texture2D( tDiffuse1,vUv);
  gl_FragColor = c * (1. - opacity) + c1 * opacity;
  //gl_FragColor = c  + c1;
}
`;
      this.mergeMaterial = new THREE.ShaderMaterial({
      uniforms: this.mergeUniforms,
      vertexShader: mergeVertexShader,
      fragmentShader: mergeFragmentShader
      });

    this.mergeCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.mergeScene = new THREE.Scene();

    this.mergeQuad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    this.mergeScene.add(this.mergeQuad);


	}

  setSize(width,height){
    this.width = width;
    this.height = height;
    this.windowHalfX = width / 2;
    this.windowHalfY = height/ 2;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderTarget.setSize(width,height);
  }

  initComputeRenderer(){
    		let gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, this.renderer );
        this.gpuCompute = gpuCompute;
				var dtPosition = gpuCompute.createTexture();
				var dtVelocity = gpuCompute.createTexture();
				this.fillPositionTexture( dtPosition );
				this.fillVelocityTexture( dtVelocity );
				this.velocityVariable = gpuCompute.addVariable( "textureVelocity", fragmentShaderVelocity, dtVelocity );
				this.positionVariable = gpuCompute.addVariable( "texturePosition", fragmentShaderPosition, dtPosition );

				gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] );
				gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] );

				this.positionUniforms = this.positionVariable.material.uniforms;
				this.velocityUniforms = this.velocityVariable.material.uniforms;
				this.positionUniforms.time = { value: 0.0 };
				this.positionUniforms.delta = { value: 0.0 };
				this.velocityUniforms.time = { value: 1.0 };
				this.velocityUniforms.delta = { value: 0.0 };
				this.velocityUniforms.testing = { value: 1.0 };
				this.velocityUniforms.seperationDistance = { value: 1.0 };
				this.velocityUniforms.alignmentDistance = { value: 1.0 };
				this.velocityUniforms.cohesionDistance = { value: 1.0 };
				this.velocityUniforms.freedomFactor = { value: 1.0 };
				this.velocityUniforms.predator = { value: new THREE.Vector3() };
				this.velocityVariable.material.defines.BOUNDS = this.BOUNDS.toFixed( 2 );
				this.velocityVariable.wrapS = THREE.RepeatWrapping;
				this.velocityVariable.wrapT = THREE.RepeatWrapping;
				this.positionVariable.wrapS = THREE.RepeatWrapping;
				this.positionVariable.wrapT = THREE.RepeatWrapping;
				var error = gpuCompute.init();
				if ( error !== null ) {
				    throw error;
				}
  }

  initBirds() {
    var geometry = new BirdGeometry();
    // For Vertex and Fragment
    this.birdUniforms = {
      color: { value: new THREE.Color( 0xff2200 ) },
      texturePosition: { value: null },
      textureVelocity: { value: null },
      time: { value: 1.0 },
      delta: { value: 0.0 },
      tDiffuse: { value: null }
    };
    // ShaderMaterial
    var material = new THREE.ShaderMaterial( {
      uniforms:       this.birdUniforms,
      vertexShader:   birdsVS,
      fragmentShader: birdsFS,
      side: THREE.DoubleSide
    });

    this.birdMesh = new THREE.Mesh( geometry, material );
    this.birdMesh.rotation.y = Math.PI / 2;
    this.birdMesh.matrixAutoUpdate = false;
    this.birdMesh.updateMatrix();
    this.scene.add(this.birdMesh);
  }

  fillPositionTexture( texture ) {
    var theArray = texture.image.data;
    for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
      var x = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      var y = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      var z = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      theArray[ k + 0 ] = x;
      theArray[ k + 1 ] = y;
      theArray[ k + 2 ] = z;
      theArray[ k + 3 ] = 1;
    }
  }
  
  fillVelocityTexture( texture ) {
    var theArray = texture.image.data;
    for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
      var x = Math.random() - 0.5;
      var y = Math.random() - 0.5;
      var z = Math.random() - 0.5;
      theArray[ k + 0 ] = x * 10;
      theArray[ k + 1 ] = y * 10;
      theArray[ k + 2 ] = z * 10;
      theArray[ k + 3 ] = 1;
    }
  }

  update(time){
    let timeMs = ~~(time * 1000);
    this.now = time;
    var delta = ~~(this.now*1000 - this.last*1000) / 1000;
    if (delta > 1) delta = 1; // safety cap on arge deltas
    this.last = time;
    this.positionUniforms.time.value = timeMs;
    this.positionUniforms.delta.value = delta;
    this.velocityUniforms.time.value = timeMs;
    this.velocityUniforms.delta.value = delta;
    this.birdUniforms.time.value = timeMs;
    this.birdUniforms.delta.value = delta;
    this.velocityUniforms.predator.value.set(Math.cos(Math.sin(time / 4) * Math.PI) * 0.1,Math.sin(Math.cos(time / 4) * Math.PI) * 0.1,0);
    this.gpuCompute.compute();
    this.birdUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
    this.birdUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;
  }

	render(renderer, writeBuffer, readBuffer, delta, maskActive){
    
   // this.birdUniforms['tDiffuse'].value = readBuffer.texture;
    this.mergeUniforms['tDiffuse'].value = readBuffer.texture;
    this.mergeUniforms['tDiffuse1'].value = this.renderTarget.texture;
//    this.mergeUniforms['opacity'].value = 0.25;
    this.mergeQuad.material = this.mergeMaterial;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera,this.renderTarget );
      renderer.render(this.mergeScene,this.mergeCamera);

		} else {

			renderer.render( this.scene, this.camera,this.renderTarget , this.clear );
      renderer.render(this.mergeScene,this.mergeCamera,writeBuffer);

		}

	}
}

/**
 * @author alteredq / http://alteredqualia.com/
 */

//The MIT License (MIT)
//
//Copyright (c) 2015 Satoshi Fujiwara
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

// リリース時にはコメントアウトすること
//document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
//':35729/livereload.js?snipver=2"></' + 'script>');
//import sharp  from 'sharp';
//import SFCapturePass from '../SFCapturePass';
//import SFRydeen from '../SFRydeen';
var time;

// メイン
window.addEventListener('load', function () {
  var qstr = new QueryString();
  var params = qstr.parse(window.location.search.substr(1));
  var preview = params.preview == 'true';
  const fps = 60;//parseFloat(params.framerate);
  var WIDTH = window.innerWidth , HEIGHT = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ antialias: false, sortObjects: true });
//  var audioAnalyser = new AudioAnalyser();
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0x000000, 1);
  renderer.domElement.id = 'console';
  renderer.domElement.className = 'console';
  renderer.domElement.style.zIndex = 0;

  d3.select('#content').node().appendChild(renderer.domElement);
  renderer.clear();


  //レンダリング
  var r = 0.0;
  var step = 48000 / fps;
  var frameDelta = 30 / fps;
  var waveCount = 0;
  var index = 0;
  time = 0;//(60420 - 1500) /1000 ;//0.0;
  var frameNo = 0;
  var endTime = 60.0 * 4.0 + 30.0;
  var frameSpeed = 1.0 / fps; 
  var delta = frameSpeed;
  var previewCount = 0;
  var chR;
  var chL;
  var timer = 0;
  var pchain = Promise.resolve(0);
  var writeFilePromises = []; 

  // Post Effect

  let composer = new THREE.EffectComposer(renderer);
  composer.setSize(WIDTH, HEIGHT);

  //let renderPass = new THREE.RenderPass(scene, camera);
//  var animMain = new SFRydeen(WIDTH,HEIGHT,fps,endTime,SAMPLE_RATE);
//  var animMain = new SFGpGpuPass(WIDTH,HEIGHT,renderer);
//  animMain.renderToScreen = false;
//  animMain.enabled = true;
//  composer.addPass(animMain);

  let gpuPass = new SFGpGpuPass(WIDTH,HEIGHT,renderer);
  gpuPass.renderToScreen = false;
  gpuPass.enabled = true;
  composer.addPass(gpuPass);

  let sfShaderPass = new SFShaderPass(WIDTH,HEIGHT);
  sfShaderPass.enabled = true;
  sfShaderPass.renderToScreen = true;
  composer.addPass(sfShaderPass);

  
//   let glitchPass = new GlitchPass();
//   glitchPass.renderToScreen = false;
//   glitchPass.enabled = true;
//   glitchPass.goWild = false;
//   composer.addPass( glitchPass );

//   let dotScreen = new THREE.ShaderPass(THREE.DotScreenShader);
//   dotScreen.uniforms['scale'].value = 4;
//   dotScreen.enabled = false;
//   dotScreen.renderToScreen = false;

//   composer.addPass(dotScreen);

//   let sf8Pass = new SF8Pass();
// //  rgbShift.uniforms['amount'].value = 0.0035;
//   sf8Pass.enabled = true;
//   sf8Pass.renderToScreen = true;
//   composer.addPass(sf8Pass);

  // let rgbShift = new THREE.SF8Pass(THREE.RGBShiftShader);
  // rgbShift.uniforms['amount'].value = 0.0035;
  // rgbShift.enabled = false;
  // rgbShift.renderToScreen = false;
  // composer.addPass(rgbShift);

  // let sfCapturePass;
  // if(!preview){
  //   sfCapturePass = new SFCapturePass(WIDTH,HEIGHT);
  //   sfCapturePass.enabled = true;
  //   sfCapturePass.renderToScreen = true;
  //   composer.addPass(sfCapturePass);
  // }

  //renderPass.renderToScreen = true;

  function start(tween){
    let t = tween();
    return t.start.bind(t);
  }

  function fillEffect(){
    return  new Tween.Tween({})
      .to({},40)
      .onStart(()=>{
        glitchPass.goWild = true;
      })
      .onComplete(()=>{
        glitchPass.goWild = false;
      });
  }

  // 間奏
  function intEffect(){
    return  new Tween.Tween({})
      .to({},25.175 * 1000)
      .onUpdate(()=>{
        dotScreen.uniforms['scale'].value = (chR[waveCount] + chL[waveCount]) * 8 + 1;
      })
      .onStart(()=>{
        dotScreen.enabled = true;
      })
      .onComplete(()=>{
        dotScreen.enabled = false;
      });
  }

  function intEffect2(){
    return  new Tween.Tween({})
      .to({},80)
      .onUpdate(()=>{
      })
      .onStart(()=>{
        dotScreen.enabled = false;
      })
      .onComplete(()=>{
        dotScreen.enabled = true;
      });
  }

  // テクスチャのアップデート
  var events = [
    // 馬のフェードイン・フェードアウト
    // {time:60420 - 1500,func:animMain.horseFadein()},
    // {time:60240 + 20140 - 3000 - 1500,func:animMain.horseFadeout()},
    // {time:134266 - 1500,func:animMain.horseFadein()},
    // {time:134266 + 20140 - 3000 - 1500,func:animMain.horseFadeout()},
    // // シリンダーの回転
    // {time:0,func:start(animMain.rotateCilynder.bind(animMain))},
    // // カメラワーク
    // {time:20.140 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
    // {time:32.727 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
    // {time:46.993 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
    // {time:60.420 * 1000 - 1500,func:start(animMain.cameraTween4.bind(animMain))},
    // {time:79.720 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
    // {time:93.986 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
    // {time:106.573 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
    // {time:120.839 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
    // {time:133.427 * 1000 - 1500,func:start(animMain.cameraTween4.bind(animMain))},
    // {time:180.420 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
    // drums fill
    // {time:5.874 * 1000 - 1500,func:start(fillEffect)},
    // {time:6.294 * 1000 - 1500,func:start(fillEffect)},

    // {time:19.510 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:19.510 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:19.510 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:19.510 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:19.510 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    // {time:32.727 * 1000 - 1500,func:start(fillEffect)},
    // {time:32.727 * 1000 - 1500 + 420,func:start(fillEffect)},

    // {time:46.364 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:46.364 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:46.364 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:46.364 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:46.364 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    // {time:49.719 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:49.719 * 1000 - 1500 + 105,func:start(fillEffect)},
    
    // {time:50.137 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:50.137 * 1000 - 1500 + 105,func:start(fillEffect)},

    // {time:59.794 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:59.794 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:59.794 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:59.794 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:59.794 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    // {time:59.794 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},

    // {time:79.722 * 1000 - 1500,func:start(fillEffect)},
    // {time:79.722 * 1000 - 1500 + 420,func:start(fillEffect)},

    // {time:92.308 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:92.308 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:92.727 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:92.727 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:93.255 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:93.255 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:93.255 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:93.255 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:93.255 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    // {time:93.255 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},

    // {time:100.066 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:100.066 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:100.066 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:100.066 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:100.066 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    // {time:106.575 * 1000 - 1500,func:start(fillEffect)},
    // {time:106.575 * 1000 - 1500 + 420,func:start(fillEffect)},

    // {time:120.000 * 1000 - 1500,func:start(fillEffect)},
    // {time:120.000 * 1000 - 1500 + 210,func:start(fillEffect)},
    // {time:120.000 * 1000 - 1500 + 420,func:start(fillEffect)},
    // {time:120.000 * 1000 - 1500 + 630,func:start(fillEffect)},

    // {time:132.800 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:132.800 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:132.800 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:132.800 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:132.800 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    // {time:133.428 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:133.428 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:133.428 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:133.428 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:133.428 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    // {time:133.428 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},
    // {time:133.428 * 1000 - 1500 + 105 * 6,func:start(fillEffect)},
    
    // {time:153.570 * 1000 - 1500,func:start(fillEffect)},
    // {time:153.570 * 1000 - 1500 + 420,func:start(fillEffect)},

    // {time:179.582 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:179.582 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:179.582 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    // {time:180.002 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:180.002 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:180.002 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    // {time:180.410 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:180.410 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:180.410 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:180.410 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:180.410 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    // {time:180.410 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},
    // {time:180.410 * 1000 - 1500 + 105 * 6,func:start(fillEffect)},

    // {time:187.134 * 1000 - 1500,func:start(fillEffect)},
    // {time:187.134 * 1000 - 1500 + 420,func:start(fillEffect)},

    // {time:193.222 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:193.222 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:193.222 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:193.222 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:193.222 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    // {time:193.841 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:193.841 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:193.841 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:193.841 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:193.841 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    // {time:193.841 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},
    // {time:193.841 * 1000 - 1500 + 105 * 6,func:start(fillEffect)},

    // {time:200.730 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:200.730 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:200.730 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:200.730 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:200.730 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    
    // {time:207.276 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:207.276 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:207.276 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    // {time:207.687 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:207.687 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:207.687 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},

    // {time:214.199 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:214.199 * 1000 - 1500 + 105,func:start(fillEffect)},

    // {time:214.612 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:214.612 * 1000 - 1500 + 105,func:start(fillEffect)},

    // {time:220.068 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:220.068 * 1000 - 1500 + 210,func:start(fillEffect)},
    // {time:220.068 * 1000 - 1500 + 210 * 2,func:start(fillEffect)},
    // {time:220.068 * 1000 - 1500 + 210 * 3,func:start(fillEffect)},
    // {time:220.068 * 1000 - 1500 + 210 * 4,func:start(fillEffect)},
    // {time:220.068 * 1000 - 1500 + 210 * 5,func:start(fillEffect)},
    // {time:220.068 * 1000 - 1500 + 210 * 6,func:start(fillEffect)},

    // {time:227.626 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:227.626 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:227.626 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:227.626 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:227.626 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},

    // {time:233.492 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:233.492 * 1000 - 1500 + 105,func:start(fillEffect)},

    // {time:233.916 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:233.916 * 1000 - 1500 + 105,func:start(fillEffect)},

    // {time:234.234 * 1000 - 1500 ,func:start(fillEffect)},
    // {time:234.234 * 1000 - 1500 + 105,func:start(fillEffect)},
    // {time:234.234 * 1000 - 1500 + 105 * 2,func:start(fillEffect)},
    // {time:234.234 * 1000 - 1500 + 105 * 3,func:start(fillEffect)},
    // {time:234.234 * 1000 - 1500 + 105 * 4,func:start(fillEffect)},
    // {time:234.234 * 1000 - 1500 + 105 * 5,func:start(fillEffect)},

    // 間奏エフェクト
    //{time:154.406 * 1000 - 1500,func:start(intEffect)}
    //{time:0,func:start(intEffect)}

  ];
  
  // // 間奏エフェクト
  // {
  //   let s = 161.119 * 1000 - 1500;
  //   for(let i = 0;i < 11;++i){
  //     let st = s + i * 420 * 4;
  //     events = events.concat([
  //       {time:st,func:start(intEffect2)},
  //       {time:st + 210,func:start(intEffect2)},
  //       {time:st + 420,func:start(intEffect2)},
  //       {time:st + 735,func:start(intEffect2)},
  //       {time:st + 945,func:start(intEffect2)},
  //       {time:st + 1155,func:start(intEffect2)},
  //       {time:st + 1260,func:start(intEffect2)},
  //       {time:st + 1470,func:start(intEffect2)},
  //     ]);
  //   }
  // }


  var timeline = new TimeLine(events); 

  if(time != 0){
    timeline.skip(time);
  }

  window.addEventListener( 'resize', ()=>{
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;
//        windowHalfX = window.innerWidth / 2;
//				windowHalfY = window.innerHeight / 2;
//				camera.aspect = window.innerWidth / window.innerHeight;
//				camera.updateProjectionMatrix();
				renderer.setSize(WIDTH,HEIGHT);
        composer.setSize(WIDTH,HEIGHT);
  }
  , false );
  
  function render(preview) {
    // if (preview) {
    //   // プレビュー
    //   // previewCount++;
    //   // if ((previewCount & 1) == 0) {
    //   //   requestAnimationFrame(render.bind(render, true));
    //   //   return;
    //   // }
    // }

    time += frameSpeed;
    // if (time > endTime) {
    //   Promise.all(writeFilePromises);
    //   window.close();
    //   return;
    // }
    ++frameNo;

    waveCount += step;
    // if(waveCount >= chR.length){
    //   Promise.all(writeFilePromises);
    //   window.close();
    // }

    //animMain.update(time);
    //renderer.clear();
    gpuPass.update(time);
    composer.render();

    if(sfShaderPass.enabled && ((frameNo & 3) == 0)){
      sfShaderPass.uniforms.time.value += 0.105 * 4 * frameDelta;
    }
    let timeMs = time * 1000;
    timeline.update(timeMs);
    Tween.update(timeMs);
    // プレビュー
    requestAnimationFrame(render.bind(null, preview));
  }
  
  render(preview);

});

}());
