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

		{

			// Node.js
			module.exports = TWEEN;

		}

	})(commonjsGlobal);
	});

	var eventemitter3 = createCommonjsModule(function (module) {

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
	{
	  module.exports = EventEmitter;
	}
	});

	class TimeLine extends eventemitter3
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

	const NUM_X = 16, NUM_Y = 12;
	const NUM_OBJS = NUM_X * NUM_Y;

	class HorseAnim extends THREE.Pass {
	  constructor(width, height) {
	    super();

	    const scene = this.scene = new THREE.Scene();

	    // カメラの作成
	    const camera = this.camera = new THREE.PerspectiveCamera(90.0, width / height);
	    camera.position.x = 0.0;
	    camera.position.y = 0.0;
	    camera.position.z = 250.0;//(WIDTH / 2.0) * HEIGHT / WIDTH;
	    camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
	    this.width = width;
	    this.height = height;

	    // SVGファイルから馬のメッシュを作る
	    this.resLoading = d3.text('./horse07-2.svg').then(svgText=>{
	      const svgLoader = new THREE.SVGLoader();
	      const paths = svgLoader.parse(svgText).paths;
	      //console.log(paths);
	      const groups = this.groups = [];
	  
	      for (let y = 0; y < NUM_Y; ++y) {
	        for (let x = 0; x < NUM_X; ++x) {
	          const g = new THREE.Group();
	          g.position.set((x - NUM_X / 2) * 80, (NUM_Y / 2 - y) * 50, 1.0);
	          groups.push(g);
	          scene.add(g);
	        }
	      }
	  
	      for (let i = 0; i < paths.length; i++) {
	        const path = paths[i];
	  
	        const shapes = path.toShapes(true, false);
	  
	  
	  
	        for (let j = 0; j < shapes.length; ++j) {
	          const shape = shapes[j];
	          const geometry = new THREE.ShapeBufferGeometry(shape);
	          const positions = geometry.attributes.position.array;
	  
	          let sx = path.currentPath.currentPoint.x;
	          let sy = path.currentPath.currentPoint.y;
	          let ex = path.currentPath.currentPoint.x;
	          let ey = path.currentPath.currentPoint.y;
	  
	          for (let k = 0, e = positions.length; k < e; k += 3) {
	            sx = Math.min(sx, positions[k + 0/* x */]);
	            sy = Math.min(sy, positions[k + 1/* y */]);
	            ex = Math.max(ex, positions[k + 0/* x */]);
	            ey = Math.max(ey, positions[k + 1/* y */]);
	          }
	  
	          let cx = ex - (ex - sx) / 2;
	          let cy = ey - (ey - sy) / 2;
	  
	          for (let k = 0, e = positions.length; k < e; k += 3) {
	            positions[k + 0/* x */] -= cx;
	            positions[k + 1] = (positions[k + 1] - cy) * -1;
	            positions[k + 2] = 10.0;
	          }
	  
	  
	          for (let k = 0; k < NUM_OBJS; ++k) {
	            const material = new THREE.MeshBasicMaterial({
	              color: new THREE.Color(0.5, 0.0, 0.0),
	              side: THREE.DoubleSide,
	              depthWrite: true
	            });
	            const mesh = new THREE.Mesh(geometry, material);
	            mesh.scale.set(0.25, 0.25, 0.25);
	            mesh.visible = false;
	            groups[k].add(mesh);
	          }
	        }
	      }
	    });
	    	//レンダリング
	      this.ca = 360| 0;
	      this.cb = 143 | 0;
	      this.c = 0;
	      this.index = 0;
	  }

	  setSize(width, height) {
	    this.width = width;
	    this.height = height;

	    this.camera.aspect = this.width / this.height;
	    this.camera.updateProjectionMatrix();

	  }

	  update() {

	    this.c += 0.1;
			const idx = this.index | 0;
				for(let y = 0;y < NUM_Y;++y){
					for(let x = 0;x < NUM_X;++x){
		
					let dist = Math.abs(Math.sqrt(Math.pow((x - NUM_X / 2) * NUM_X/NUM_Y,2) + Math.pow((y - NUM_Y / 2) ,2)));
					let color_r = (Math.sin(dist + this.c) + 1.0) / 2.0; 
					let color_g = (Math.sin(dist + this.c + Math.PI / 2.0) + 1.0) / 2.0; 
					let color_b = (Math.sin(dist + this.c + Math.PI ) + 1.0) /2;
					const g = this.groups[x + y * NUM_X];
					const m = g.children;
					// let curX = g.position.x + 4;
					// if(curX > 640){
					// 	curX = -640;
					// }
	 				// g.position.set(curX,g.position.y,g.position.z);

			
					for(let k = 0;k < 10;++k){
						if (idx == k) {
							m[k].visible = true;
							m[k].material.color = new THREE.Color(color_r,color_g,color_b);
						} else {
							m[k].visible = false;
						}
					}
				}
			}

			//0.041958041958042
			this.ca -= this.cb;
			if(this.ca <= 0){
				++this.index;
				this.ca += 360 | 0;
			}

	    if (this.index > 9) this.index = 0;    


	  }

	  render(renderer, writeBuffer, readBuffer, delta, maskActive) {

	    if (this.renderToScreen) {
	      renderer.render(this.scene, this.camera);

	    } else {

				let backup = renderer.getRenderTarget();
				renderer.setRenderTarget(writeBuffer);
				this.clear && renderer.clear();
	      renderer.render(this.scene, this.camera);
				renderer.setRenderTarget(backup);

	      //renderer.render(this.scene, this.camera, writeBuffer, this.clear);

	    }

	  }
	}

	/**
	 * @author SFPGMR
	 */


	const vs = 
`
#define USE_MAP
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <skinbase_vertex>
	#ifdef USE_ENVMAP
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}
`	;

	// const vs = 
	// `
	// #define USE_MAP
	// #include <common>
	// #include <uv_pars_vertex>
	// #ifdef USE_COLOR
	// varying vec4 vColor;
	// #endif

	// void main()	{
	// 	#include <uv_vertex>
	// #ifdef USE_COLOR
	//   vColor = color;
	// #endif
	//   vUv = uv;
	//   vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	//   gl_Position = projectionMatrix * mvPosition;
	// }
	// `;

	const fs = 
`
#define USE_MAP
uniform sampler2D map;
uniform sampler2D tDiffuse;

uniform vec2 resolution;
varying vec2 vUv;
uniform float opacity;

#ifdef USE_COLOR
varying vec4 vColor;
#endif
void main(){
  vec4 c1,c2;
  vec2 p = gl_FragCoord.xy / resolution;
  
  c1 = texture2D(tDiffuse, p);
  c2 = texture2D(map, vUv);
  c2 = mapTexelToLinear( c2 );
  c2.a = opacity;
  gl_FragColor = c2;
  
  // if(length(c2.xyz) > 0.0 ) 
  // {
  //   gl_FragColor = clamp(c2 + c1,0.0,1.0);
  // } else {
  //   if(length(c1.xyz) > 0.0){
  //     gl_FragColor = vec4(0.25 - c1.rgb * 0.25,c1.a);
  //   } else {
  //     discard;
  //   }
  //       //gl_FragColor = c1 * 0.2;
  // }  
}
`	;

	//const fs = THREE.ShaderLib.basic.fragmentShader;

	class SFRydeenPass extends THREE.Pass {
	  constructor(width, height, fps, endTime, sampleRate = 48000) {
	    super();

	    this.width = width;
	    this.height = height;
	    this.time = 0;
	    this.needSwap = false;
	    this.clear = true;
	    var scene = new THREE.Scene();
	    this.scene = scene;
	    this.sampleRate = sampleRate;
	    this.chR = null;
	    this.chL = null;
	    this.fps = fps;
	    this.endTime = endTime;
	    this.step = sampleRate / fps;
	    this.frameDelta = 30 / fps;
	    this.fftsize = 256;
	    this.fft = new FFT(this.fftsize, sampleRate);
	    this.frameSpeed = 1.0 / fps;
	    this.delta = this.frameSpeed;
	    this.radius = 1000, this.theta = 0;
	    this.fftmeshSpeed = 50 * this.frameDelta;
	    //scene.fog = new THREE.Fog( 0x000000, -1000, 8000 );

	    // カメラの作成
	    // var camera = new THREE.PerspectiveCamera(90.0, WIDTH / HEIGHT);
	    // camera.position.x = 0.0;
	    // camera.position.y = 0.0;
	    // camera.position.z = (WIDTH / 2.0) * HEIGHT / WIDTH;
	    // camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
	    var camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
	    camera.position.z = 500;
	    camera.position.x = 0;
	    camera.position.y = 1000;
	    camera.target = new THREE.Vector3(0, 0, 0);
	    this.camera = camera;

	    var light1 = new THREE.DirectionalLight(0xefefff, 1.5);
	    light1.position.set(1, 1, 1).normalize();
	    scene.add(light1);
	    this.light1 = light1;

	    var light2 = new THREE.DirectionalLight(0xffefef, 1.5);
	    light2.position.set(-1, -1, -1).normalize();
	    scene.add(light2);
	    this.light2 = light2;

	    var horseAnimSpeed = (60.0 / (143.0));
	    var meshes = [];
	    this.meshes = meshes;
	    var mixers = [];
	    this.mixers = mixers;

	    var HORSE_NUM = 40;


	    // FFT表示用テクスチャ
	    var TEXW = 1024;
	    this.TEXW = TEXW;
	    var TEXH = 1024;
	    this.TEXH = TEXH;
	    var canvas = document.createElement('canvas');
	    canvas.width = TEXW;
	    canvas.height = TEXH;
	    var ctx = canvas.getContext('2d');
	    ctx.fillStyle = "rgba(255,255,255,1.0)";
	    ctx.fillRect(0, 0, TEXW, TEXH);
	    this.ctx = ctx;
	    var ffttexture = new THREE.Texture(canvas);
	    this.ffttexture = ffttexture;

	    var ffttexture2 = new THREE.Texture(canvas);
	    this.ffttexture2 = ffttexture2;

	    ffttexture.needsUpdate = true;
	    ffttexture2.needsUpdate = true;

	    var fftgeometry = new THREE.PlaneBufferGeometry(8192, 8192, 1, 1);
	    this.fftgeometry = fftgeometry;

	    const fftmaterial = this.fftmaterial = new THREE.ShaderMaterial({
	      vertexShader: vs,
	      fragmentShader: fs,
	      uniforms: {
	        map: { value : ffttexture2} ,
	        tDiffuse: { value: new THREE.Texture() },
	        resolution: { value: new THREE.Vector2() },
	        uvTransform: {value: new THREE.Matrix3()},
	        opacity: {value:1.0}
	      },
	      side: THREE.DoubleSide,transparent:true,overdraw:true
	    });

	   //const fftmaterial = new THREE.MeshBasicMaterial({ map: ffttexture2, transparent: true, overdraw: true, opacity: 1.0, side: THREE.DoubleSide });
	    this.fftmaterial = fftmaterial;

	    var fftmesh = new THREE.Mesh(fftgeometry, fftmaterial);
	    this.fftmesh = fftmesh;

	    ffttexture2.wrapS = THREE.RepeatWrapping;
	    ffttexture2.wrapT = THREE.RepeatWrapping;
	    ffttexture2.repeat.set(8, 8);

	    ffttexture.wrapS = THREE.RepeatWrapping;
	    ffttexture.wrapT = THREE.RepeatWrapping;
	    ffttexture.repeat.set(1, 16);

	    fftmesh.position.z = 0.0;
	    fftmesh.rotation.x = Math.PI / 2;

	    var fftmesh2 = fftmesh.clone();
	    this.fftmesh2 = fftmesh2;
	    fftmesh2.position.x += 8192;

	    scene.add(fftmesh);
	    scene.add(fftmesh2);

	    var wgeometry = new THREE.ConeBufferGeometry(1024, 1024, 32, 32, true);
	    wgeometry.rotateY(Math.PI / 2);
	    this.wgeometry = wgeometry;

	    const fftmaterial2 = this.fftmaterial2 = new THREE.ShaderMaterial({
	      vertexShader: vs,
	      fragmentShader: fs,
	      uniforms: {
	        map: { type: 't', value: ffttexture },
	        tDiffuse: { type: 't', value: null },
	        resolution: { type: 'v2', value: new THREE.Vector2() },
	        uvTransform: {value: new THREE.Matrix3()},
	        opacity: {value:1.0}
	       },
	      side: THREE.DoubleSide,
	      transparent: true
	    });

	//    var wmesh = new THREE.Mesh(wgeometry, new THREE.MeshBasicMaterial({ map: ffttexture, transparent: true, side: THREE.DoubleSide }));
	    var wmesh = new THREE.Mesh(wgeometry, fftmaterial2);
	    wmesh.position.x = 0;
	    wmesh.position.y = 0;
	    wmesh.rotation.y = Math.PI / 2;
	    wmesh.rotation.z = Math.PI / 2;
	    wmesh.position.z = 450.0;
	    this.wmesh = wmesh;
	    wmesh.needsUpdate = true;

	    scene.add(wmesh);
	    camera.position.z = 1000;
	    camera.position.x = 0;
	    camera.position.y = 0;

	    var horseMaterial;
	    this.horseMaterial = horseMaterial;
	    var horseGroup = new THREE.Group();
	    this.horseGroup = horseGroup;

	    // 馬メッシュのロード

	    this.init = (async () => {
	      await new Promise((resolve, reject) => {
	        const loader = new THREE.GLTFLoader();
	        loader.load( "./horse.glb", function( gltf ) {
	          meshes[0] = gltf.scene.children[ 0 ];
	          meshes[0].scale.set( 1.5, 1.5, 1.5 );
	          meshes[0].rotation.y = 0.5 * Math.PI;
	          meshes[0].position.y = 0;
	          meshes[0].material.transparent = true;
	          meshes[0].material.opacity = 0.001;
	          meshes[0].material.needsUpdate = true;

	    //       meshes[0].material =  new THREE.MeshBasicMaterial( {
	    //          vertexColors: THREE.FaceColors,
	    //           // shading: THREE.SmoothShading,
	    //           //transparent:true,
	    //           //map:ffttexture,
	    //         // side:THREE.DoubleSide,
	    // //            morphNormals: true,
	    //             //color: 0xffffff,
	    //             morphTargets: true,
	    //             transparent: true,
	    //             opacity:0.001,
	    //             //color:new THREE.Color(1.0,0.5,0.0)
	  
	    //             morphNormals: true,
	    //             //shading: THREE.SmoothShading//,
	    //             //morphTargets: true
	    //           } );;
	  
	          for (let i = 1; i < HORSE_NUM; ++i) {
	            meshes[i] = meshes[0].clone();
	            meshes[i].material.transparent = true;
	            meshes[i].material.opacity = 0.001;
	            meshes[i].material.needsUpdate = true;

	            meshes[i].position.x = (Math.floor((Math.random() - 0.5) * 10)) * 450;
	            meshes[i].position.z = (Math.floor((Math.random() - 0.5) * 10)) * 150;
	            meshes[i].position.y = 0/*(Math.random() - 0.6) * 1000*/;
	          }

	          for (let i = 0; i < HORSE_NUM; ++i) {
	            horseGroup.add(meshes[i]);
	            //scene.add( meshes[i] );
	            mixers[i] = new THREE.AnimationMixer(meshes[i]);
	            //let clip = THREE.AnimationClip.CreateFromMorphTargetSequence('gallop', geometry.morphTargets, fps);
	            let clip = gltf.animations[ 0 ].clone();
	            mixers[i].clipAction(clip).setDuration(horseAnimSpeed).play();
	          }
	          horseGroup.visible = false;
	          scene.add(horseGroup);
	          resolve();

	    
	          // mixer = new THREE.AnimationMixer( mesh );
	    
	          // mixer.clipAction( gltf.animations[ 0 ] ).setDuration( 1 ).play();
	    
	        } );
	    
	        // loader.load("./horse.glb", (gltf) => {
	        //   //geometry = new THREE.BufferGeometry().fromGeometry(geometry);

	        //   // meshes[0] = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
	        //   //   vertexColors: THREE.FaceColors,
	        //   //   morphTargets: true
	        //   // } ) );
	        //   //geometry.computeVertexNormals();
	        //   let mat = new THREE.MeshPhongMaterial({
	        //     // vertexColors: THREE.FaceColors,
	        //     // shading: THREE.SmoothShading,
	        //     //transparent:true,
	        //     //map:ffttexture,
	        //     side: THREE.DoubleSide,
	        //     //morphNormals: true,
	        //     // color: 0xffffff,
	        //     morphTargets: true,
	        //     transparent: true,
	        //     opacity: 0.0,
	        //     //blending:THREE.AdditiveBlending,
	        //     color: new THREE.Color(1.0, 0.5, 0.0),
	        //     //morphNormals: true,
	        //     //shading: THREE.SmoothShading
	        //     //morphTargets: true
	        //   });
	        //   horseMaterial = mat;
	        //   //mat.reflectivity = 1.0;
	        //   //mat.specular = new THREE.Color(0.5,0.5,0.5);
	        //   //mat.emissive = new THREE.Color(0.5,0,0);
	        //   //        mat.wireframe = true;
	        //   meshes[0] = new THREE.Mesh(geometry, mat);


	        //   meshes[0].scale.set(1.5, 1.5, 1.5);
	        //   meshes[0].rotation.y = 0.5 * Math.PI;
	        //   meshes[0].position.y = 0;


	        //   for (let i = 1; i < HORSE_NUM; ++i) {
	        //     meshes[i] = meshes[0].clone();
	        //     //           meshes[i].material =  new THREE.MeshPhongMaterial( {
	        //     //         // vertexColors: THREE.FaceColors,
	        //     //          // shading: THREE.SmoothShading,
	        //     //          //transparent:true,
	        //     //          //map:ffttexture,
	        //     //         // side:THREE.DoubleSide,
	        //     // //            morphNormals: true,
	        //     //            // color: 0xffffff,
	        //     // 						morphTargets: true,
	        //     //             transparent: true,
	        //     //             opacity:0.5,
	        //     //                         color:new THREE.Color(1.0,0.5,0.0)

	        //     // 						//morphNormals: true,
	        //     // 						//shading: THREE.SmoothShading//,
	        //     //             //morphTargets: true
	        //     //         } );;
	        //     meshes[i].position.x = (Math.floor((Math.random() - 0.5) * 10)) * 450;
	        //     meshes[i].position.z = (Math.floor((Math.random() - 0.5) * 10)) * 150;
	        //     meshes[i].position.y = 0/*(Math.random() - 0.6) * 1000*/;
	        //   }

	        //   for (let i = 0; i < HORSE_NUM; ++i) {
	        //     horseGroup.add(meshes[i]);
	        //     //scene.add( meshes[i] );
	        //     mixers[i] = new THREE.AnimationMixer(meshes[i]);
	        //     let clip = THREE.AnimationClip.CreateFromMorphTargetSequence('gallop', geometry.morphTargets, fps);
	        //     mixers[i].clipAction(clip).setDuration(horseAnimSpeed).play();
	        //   }
	        //   horseGroup.visible = false;
	        //   scene.add(horseGroup);
	        //   resolve();
	        //});
	      });

	    })();


	    // var gto;
	    // var horseGroups = [];
	    // try {
	    //   var shapes = [];
	    //   for (var i = 0; i < 11; ++i) {
	    //     var id = 'horse' + ('0' + i).slice(-2);
	    //     var path = fs.readFileSync('./media/' + id + '.json', 'utf-8');
	    //     // デシリアライズ
	    //     shape = sf.deserialize(JSON.parse(path));

	    //     shape = shape.toShapes();
	    //     var shapeGeometry = new THREE.ShapeGeometry(shape);
	    //     shapes.push({ name: id, shape: shapeGeometry });
	    //   }

	    //   var ggroup = new THREE.Group();
	    //   for (var i = 0; i < 1; ++i) {
	    //     var group = new THREE.Group();
	    //     shapes.forEach(function (sm) {
	    //       var shapeMesh = createShape(sm.shape, 0xFFFF00, 0, 0, 0, 0, 0, 0, 1.0);
	    //       shapeMesh.visible = false;
	    //       shapeMesh.name = sm.name;
	    //       group.add(shapeMesh);
	    //     });
	    //     group.position.x = 0;
	    //     group.position.y = 0;
	    //     group.position.z = 0.0;
	    //     horseGroups.push(group);
	    //     ggroup.add(group);
	    //   }
	    //   scene.add(ggroup);
	    //   ggroup.name = 'world';

	    //   //d3.select('#svg').remove();
	    // } catch (e) {
	    //   console.log(e + '\n' + e.stack);
	    // }

	    //   var horseGroups = [];
	    //   window.addEventListener('resize', function () {
	    // //    WIDTH = window.innerWidth;
	    // //    HEIGHT = window.innerHeight;
	    //     // renderer.setSize(WIDTH, HEIGHT);
	    //     // camera.aspect = WIDTH / HEIGHT;
	    //     // camera.position.z = (WIDTH / 2.0) * HEIGHT / WIDTH;
	    //     // camera.updateProjectionMatrix();
	    //   });


	    // var gto;
	    // try {

	    // } catch (e) {
	    //   console.log(e + '\n' + e.stack);
	    // }


	    // scene.add(fftmesh);

	    // Particles

	    // {
	    //   let material = new THREE.SpriteMaterial({
	    //     map: new THREE.CanvasTexture(this.generateSprite()),
	    //     blending: THREE.AdditiveBlending,
	    //     transparent: true
	    //   });
	    //   for (var i = 0; i < 1000; i++) {
	    //     let p = new THREE.Sprite(material);
	    //     p.visible = false;
	    //     this.initParticle(p, 207.273 * 1000 - 1500 + i * 10);
	    //     scene.add(p);
	    //   }
	    // }


	  }

	  // 馬のフェードイン・フェードアウト
	  horseFadein() {
	    let fadein = new Tween.Tween({ opacity: 0.001 });
	    let self = this;
	    fadein.to({ opacity: 1.0 }, 5000);
	    fadein.onUpdate(function () {
	      self.meshes.forEach((d) => {
	        d.material.opacity = this.opacity;
	        d.material.needsUpdate = true;
	      });
	    });
	    fadein.onStart(() => {
	      self.horseGroup.visible = true;
	    });
	    return fadein.start.bind(fadein);
	  }

	  horseFadeout() {
	    let fadeout = new Tween.Tween({ opacity: 1.0 });
	    let self = this;
	    fadeout.to({ opacity: 0.001 }, 3000);
	    fadeout.onUpdate(function () {
	      self.meshes.forEach((d) => {
	        d.material.opacity = this.opacity;
	        d.material.needsUpdate = true;
	      });
	    });
	    fadeout.onComplete(() => {
	      self.horseGroup.visible = false;
	    });
	    return fadeout.start.bind(fadeout);
	  }

	  // シリンダーの回転
	  rotateCilynder() {
	    let rotateCilynder = new Tween.Tween({ time: 0 });
	    let self = this;
	    rotateCilynder
	      .to({ time: self.endTime }, 1000 * self.endTime)
	      .onUpdate(()=> {
	        //this.wmesh.geometry.rotateY(0.05 * this.frameDelta);
	        this.camera.lookAt(this.camera.target);
	      });
	    return rotateCilynder;
	  }

	  // カメラワーク

	  cameraTween() {
	    let cameraTween = new Tween.Tween({ x: 0, y: 0, z: 1000, opacity: 1.0 });
	    cameraTween.to({ x: 0, z: this.radius, y: 2000, opacity: 0.0 }, 1000);
	    self = this;
	    //cameraTween.delay(20.140 * 1000 - 1500);
	    cameraTween.onUpdate(function () {
	      self.fftmesh.material.opacity = 1.0 - this.opacity;
	      self.fftmesh2.material.opacity = 1.0 - this.opacity;
	      self.wmesh.material.opacity = this.opacity;
	      self.camera.position.x = this.x;
	      self.camera.position.y = this.y;
	    });
	    cameraTween.onStart(function () {
	      self.fftmesh.visible = true;
	      self.fftmesh2.visible = true;
	    });
	    cameraTween.onComplete(function () {
	      self.wmesh.visible = false;
	    });
	    var cameraTween11 = new Tween.Tween({ theta: 0 });
	    cameraTween11.to({ theta: -2 * Math.PI }, 11587);
	    cameraTween11.onUpdate(function () {
	      self.camera.position.x = Math.sin(this.theta) * self.radius;
	      self.camera.position.z = Math.cos(this.theta) * self.radius;
	    });
	    cameraTween.chain(cameraTween11);
	    return cameraTween;
	  }

	  cameraTween2() {
	    let cameraTween2 = new Tween.Tween({ x: 0, y: 2000, z: 1000, opacity: 0.0 });
	    let self = this;
	    cameraTween2.to({ x: 0, y: 0, opacity: 1.0 }, 1000);
	    cameraTween2.onUpdate(function () {
	      self.fftmesh.material.opacity = 1.0 - this.opacity;
	      self.fftmesh2.material.opacity = 1.0 - this.opacity;
	      self.wmesh.material.opacity = this.opacity;
	      self.camera.position.x = this.x;
	      self.camera.position.y = this.y;
	    });
	    cameraTween2.onStart(function () {
	      self.wmesh.visible = true;
	    });
	    cameraTween2.onComplete(function () {
	      self.fftmesh.visible = false;
	      self.fftmesh2.visible = false;
	    });
	    return cameraTween2;
	  }

	  cameraTween4() {
	    let cameraTween4 = new Tween.Tween({ x: 0, y: 2000, z: 1000, opacity: 1.0 });
	    let self = this;
	    cameraTween4.to({ x: 0, y: 1000, z: 1000 }, 1000);
	    cameraTween4.onUpdate(function () {
	      self.camera.position.x = this.x;
	      self.camera.position.y = this.y;
	    });
	    var cameraTween41 = new Tween.Tween({ theta: 0 });
	    cameraTween41.to({ theta: 2 * Math.PI }, 18300);
	    cameraTween41.onUpdate(function () {
	      self.camera.position.x = Math.sin(this.theta) * self.radius;
	      self.camera.position.z = Math.cos(this.theta) * self.radius;
	    });
	    cameraTween4.chain(cameraTween41);

	    return cameraTween4;
	  }

	  update(time,fft=true) {
	    // ctx.fillStyle = 'rgba(0,0,0,0.2)';
	    // //ctx.fillRect(0,0,TEXW,TEXH);
	    this.time = time;
	    let TEXH = this.TEXH;
	    let TEXW = this.TEXW;
	    let ctx = this.ctx;

	    this.ctx.clearRect(0, 0, TEXW, TEXH);
	    let waveCount = ~~(time * this.sampleRate);
	    let frameNo = ~~(time * this.fps);
	    let wsize = 1024;
	    if(fft){
	      for (let i = 0; i < wsize; ++i) {
	        let r = 0, l = 0;
	        if ((waveCount + i) < (this.chR.length)) {
	          r = this.chR[waveCount + i];
	          l = this.chL[waveCount + i];
	        }
	  
	        let hsll = 'hsl(' + Math.floor(Math.abs(r) * 200 + 250) + ',100%,50%)';
	        let hslr = 'hsl(' + Math.floor(Math.abs(l) * 200 + 250) + ',100%,50%)';
	  
	  
	        // if(pat){
	        //   r = (r != 0 ? (r > 0 ? 1 : -1) : 0 ); 
	        //   l = (l != 0 ? (l > 0 ? 1 : -1) : 0 ) ; 
	        // }
	        ctx.fillStyle = hsll;
	        // if (r > 0) {
	        //   //ctx.fillRect(TEXW / 4 * 3 - r * TEXW / 4 - TEXW / wsize / 2, i * TEXH / wsize, r * TEXW / 4, TEXH / wsize);
	        //   //ctx.fillRect(TEXW / 4 * 3 - TEXW / wsize / 2, i * TEXH / wsize, TEXW / 4, TEXH / wsize);
	        //   //ctx.fillRect(TEXW / 4 * 3 - TEXW / wsize / 2, i * TEXH / wsize, TEXW / 4, TEXH / wsize);
	        // } else {
	        //   //ctx.fillRect(TEXW / 4 * 3 - TEXW / wsize / 2, i * TEXH / wsize, -r * TEXW / 4, TEXH / wsize);
	        //   ctx.fillRect(TEXW / 4 * 3 - TEXW / wsize / 2, i * TEXH / wsize, -TEXW / 4, TEXH / wsize);
	        // }

	        if(r > 0.001){
	          ctx.fillRect(TEXW / 2, i * TEXH / wsize, TEXW / 2, TEXH / wsize);
	        }
	        

	  
	        ctx.fillStyle = hslr;
	        // if (l > 0) {
	        //   //ctx.fillRect(TEXW / 4  - l * TEXW / 4 - TEXW / wsize / 2, i * TEXH / wsize, l * TEXW / 4, TEXH / wsize);
	        //   ctx.fillRect(TEXW / 4  - TEXW / wsize / 2, i * TEXH / wsize, TEXW / 4, TEXH / wsize);          
	        // } else {
	        //   // ctx.fillRect(TEXW / 4 - TEXW / wsize / 2, i * TEXH / wsize, -l * TEXW / 4, TEXH / wsize);
	        //   ctx.fillRect(TEXW / 4 - TEXW / wsize / 2, i * TEXH / wsize, -TEXW / 4, TEXH / wsize);
	        // }
	        if(l > 0.001){
	          ctx.fillRect(0, i * TEXH / wsize, TEXW / 2, TEXH / wsize);
	        }
	      }
	  
	      this.fftmesh.position.x -= this.fftmeshSpeed;
	  
	      if (this.fftmesh.position.x < -4096)
	        this.fftmesh.position.x = 0;
	  
	      this.fftmesh2.position.x -= this.fftmeshSpeed;
	  
	      if (this.fftmesh2.position.x < 0)
	        this.fftmesh2.position.x = 8192;
	  

	      // fft.forward(chR.subarray(waveCount,waveCount + fftsize));
	      // var pw = TEXH / (fftsize/2); 
	      // var spectrum = fft.real;
	      // for(var x = 0,e = fftsize/2 ;x < e;++x){
	      //   let db = -30 + Math.log10(Math.abs(spectrum[x])) * 10;
	      //   let h = (120 + db) * TEXH / 240;
	      //   let hsl = 'hsl(' + Math.floor((120 + db) / 120 * 150 + 260) + ',100%,50%)';
	      //   ctx.fillStyle = hsl;
	      //   ctx.fillRect(x * pw,TEXH/2 - h,pw,h);
	      // }
	      // fft.forward(chL.subarray(waveCount,waveCount + fftsize));
	      // spectrum = fft.real;
	      // for(var x = 0,e = fftsize/2 ;x < e;++x){
	      //   let db = -30 + Math.log10(Math.abs(spectrum[x])) * 10;
	      //   let h = (120 + db) * TEXH / 240;
	      //   let hsl = 'hsl(' + Math.floor((120 + db) / 120 * 150 + 260) + ',100%,50%)';
	      //   ctx.fillStyle = hsl;
	      //   ctx.fillRect(x * pw,TEXH / 2,pw,h);
	      // }
	  
	      // {
	      //   let idx = parseInt(index,10);
	      //   for (var i = 0, end = horseGroups.length; i < end; ++i) {
	      //     var g = horseGroups[i];
	      //     g.getObjectByName('horse' + ('00' + idx.toString(10)).slice(-2)).visible = true;
	      //     if (idx == 0) {
	      //       g.getObjectByName('horse10').visible = false;
	      //     } else {
	      //       g.getObjectByName('horse' + ('00' + (idx - 1).toString(10)).slice(-2)).visible = false;
	      //     }
	      //   } 
	      // }
	  
	      this.ffttexture.needsUpdate = true;
	      this.ffttexture2.needsUpdate = true;      

	    }

	    this.camera.lookAt(this.camera.target);


	    (frameNo & 1) &&
	      this.mixers.forEach((mixer) => {
	        mixer.update(1 / this.fps * 2);
	      });
	  }


	  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
			this.fftmaterial.uniforms[ "tDiffuse" ].value = readBuffer.texture;
			this.fftmaterial2.uniforms[ "tDiffuse" ].value = readBuffer.texture;
			this.fftmaterial.uniforms[ "resolution" ].value.x = this.width;
			this.fftmaterial2.uniforms[ "resolution" ].value.x = this.width;
			this.fftmaterial.uniforms[ "resolution" ].value.y = this.height;
	    this.fftmaterial2.uniforms[ "resolution" ].value.y = this.height;
	    //this.fftmaterial.uniforms["opacity"].value = this.fftmaterial.opacity;
	    //this.fftmaterial2.uniforms["opacity"].value = this.fftmaterial2.opacity;
	    this.fftmaterial2.uniforms.map.value.updateMatrix();
	    this.fftmaterial.uniforms.map.value.updateMatrix();
	    this.fftmaterial2.uniforms.uvTransform.value = this.fftmaterial2.uniforms.map.value.matrix;
	    this.fftmaterial.uniforms.uvTransform.value =  this.fftmaterial.uniforms.map.value.matrix;

	    if (this.renderToScreen) {
	      renderer.render(this.scene, this.camera);

	    } else {

				let backup = renderer.getRenderTarget();
				renderer.setRenderTarget(writeBuffer);
				this.clear &&  renderer.clear();
	      renderer.render(this.scene, this.camera);
				renderer.setRenderTarget(backup);

	      //renderer.render(this.scene, this.camera, writeBuffer, this.clear);

	    }

	  }

	generateSprite() {
	  var canvas = document.createElement('canvas');
	  canvas.width = 16;
	  canvas.height = 16;
	  var context = canvas.getContext('2d');
	  var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
	  gradient.addColorStop(0, 'rgba(255,255,255,1)');
	  gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
	  gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
	  gradient.addColorStop(1, 'rgba(0,0,0,1)');
	  context.clearRect(0, 0, canvas.width, canvas.height);
	  context.fillStyle = gradient;
	  context.fillRect(0, 0, canvas.width, canvas.height);
	  return canvas;
	}

	initParticle(particle, delay) {
	  //let hsl = 'hsl(' + Math.floor(Math.abs(r) * 200 + 250) + ',100%,50%)';

	  //var particle = this instanceof THREE.Sprite ? this : particle;
	  //var particle = this instanceof THREE.Sprite ? this : particle;
	  let timeMs = this.time * 1000;
	  var delay = delay !== undefined ? delay : 0;
	  particle.position.set(Math.random() * 500 - 250, Math.random() * 500 - 250, -4000);
	  particle.scale.x = particle.scale.y = Math.random() * 500 + 50;
	  new Tween.Tween(particle)
	    .delay(delay)
	    .to({}, 5000)
	    .onComplete(this.initParticle.bind(this,particle,0))
	    .onStart(function () {
	     particle.visible = true;
	    })
	    .start(timeMs);

	  new Tween.Tween(particle.position)
	    .delay(delay)
	    .to({ x: Math.random() * 500 - 250, y: Math.random() * 500 - 250, z: Math.random() * 1000 + 500 }, 10000)
	    .to({ z: Math.random() * 1000 + 500 }, 5000)
	    .start(timeMs);

	  new Tween.Tween(particle.scale)
	    .delay(delay)
	    .to({ x: 0.01, y: 0.01 }, 5000)
	    .start(timeMs);
	}  

	setSize(width,height){
	  this.camera.aspect = width / height;
	  this.camera.updateProjectionMatrix();
	}

	}

	//The MIT License (MIT)
	//import SFGpGpuPass from '../SFGpGpuPass';
	//import GlitchPass from '../GlitchPass';
	//import { hostname } from 'os';
	//import AudioAnalyser from '../AudioAnalyser.mjs';


	const SAMPLE_RATE = 96000;

	var time;

	// メイン
	window.addEventListener('load', async ()=>{
	  var qstr = new QueryString();
	  var params = qstr.parse(window.location.search.substr(1));
	  var preview = params.preview == 'true';
	  const fps = 60;//parseFloat(params.framerate);
	  var WIDTH = window.innerWidth , HEIGHT = window.innerHeight;
	  const canvas = document.createElement('canvas');
	  const context = canvas.getContext('webgl2');
	  var renderer = new THREE.WebGLRenderer({ antialias: false, sortObjects: true });
	  //var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context,antialias: false, sortObjects: true,autoClear:false});
	  

	  //var renderer = new THREE.WebGLRenderer({ antialias: false, sortObjects: true });
	  //const audioAnalyser = new AudioAnalyser();
	  renderer.setSize(WIDTH, HEIGHT);
	  renderer.setClearColor(0x000000, 1);
	  renderer.domElement.id = 'console';
	  renderer.domElement.className = 'console';
	  renderer.domElement.style.zIndex = 0;

	  d3.select('#content').node().appendChild(renderer.domElement);
	  renderer.clear();
	  var step = 48000 / fps;
	  var waveCount = 0;
	  time = 0;//20.140 * 1000 - 1500;//60420;//(60420 - 1500) /1000 ;//0.0;
	  var endTime = 60.0 * 4.0 + 30.0;
	  var frameSpeed = 1.0 / fps; 
	  var chR;
	  var chL;

	  // Post Effect

	  let composer = new THREE.EffectComposer(renderer);
	  composer.setSize(WIDTH, HEIGHT);

	  //let renderPass = new THREE.RenderPass(scene, camera);
	  var animMain = new SFRydeenPass(WIDTH,HEIGHT,fps,endTime,SAMPLE_RATE);
	  await animMain.init;
	  //var animMain = new SFGpGpuPass(WIDTH,HEIGHT,renderer);
	  animMain.renderToScreen = false;
	  animMain.enabled = true;

	  // var horseAnim = new HorseAnim(WIDTH,HEIGHT);
	  // await horseAnim.resLoading;
	  // horseAnim.renderToScreen = true;
	  // horseAnim.enabled = true;
	  // composer.addPass(horseAnim);

	  composer.addPass(animMain);

	  // let gpuPass = new SFGpGpuPass(WIDTH,HEIGHT,renderer);
	  // gpuPass.renderToScreen = false;
	  // gpuPass.enabled = true;
	  // composer.addPass(gpuPass);

	  // let sfShaderPass = new SFShaderPass(WIDTH,HEIGHT);
	  // sfShaderPass.enabled = true;
	  // sfShaderPass.renderToScreen = true;
	  // composer.addPass(sfShaderPass);


	  
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

	  // テクスチャのアップデート
	  var events = [
	    // 馬のフェードイン・フェードアウト
	    {time:21.140 * 1000 - 1500,func:animMain.horseFadein()},
	    {time:22.727 * 1000 - 1500,func:animMain.horseFadeout()},
	    {time:60420 - 1500,func:animMain.horseFadein()},
	    {time:60240 + 20140 - 3000 - 1500,func:animMain.horseFadeout()},
	    {time:134266 - 1500,func:animMain.horseFadein()},
	    {time:134266 + 20140 - 3000 - 1500,func:animMain.horseFadeout()},
	    // シリンダーの回転
	    {time:0,func:start(animMain.rotateCilynder.bind(animMain))},
	    // カメラワーク
	    {time:20.140 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
	    {time:32.727 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
	    {time:46.993 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
	    {time:60.420 * 1000 - 1500,func:start(animMain.cameraTween4.bind(animMain))},
	    {time:79.720 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
	    {time:93.986 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
	    {time:106.573 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
	    {time:120.839 * 1000 - 1500,func:start(animMain.cameraTween.bind(animMain))},
	    {time:133.427 * 1000 - 1500,func:start(animMain.cameraTween4.bind(animMain))},
	    {time:180.420 * 1000 - 1500,func:start(animMain.cameraTween2.bind(animMain))},
	    // //drums fill
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

	    // //間奏エフェクト
	    // {time:154.406 * 1000 - 1500,func:start(intEffect)},
	    // {time:0,func:start(intEffect)}

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
	    if (time > endTime) {
	      return;
	    }

	    waveCount += step;
	    if(waveCount >= chR.length){
	      return;
	    }

	    animMain.update(time);
	    //horseAnim.update();
	    //renderer.clear();
	    //gpuPass.update(time);
	    composer.render();

	    // if(sfShaderPass.enabled && ((frameNo & 3) == 0)){
	    //   sfShaderPass.uniforms.time.value += 0.105 * 4 * frameDelta;
	    // }
	    let timeMs = time * 1000;
	    timeline.update(timeMs);
	    Tween.update(timeMs);
	    // プレビュー
	    requestAnimationFrame(render.bind(null, preview));
	  }
	  

	  // ファイルのロード
	  await new Promise((resolve,reject)=>{
	    let loader = new THREE.AudioLoader();
	    loader.load('../../media/rydeen.wav',(buffer)=>{
	      chL = animMain.chL = buffer.getChannelData(0);
	      chR = animMain.chR = buffer.getChannelData(1);
	      //const audioListener = new THREE.AudioListener();
	      //let a = new THREE.Audio(audioListener);
	      //a.setBuffer(buffer);
	      //a.play();
	      resolve();
	    });
	  });

	  render(preview);

	});

}());
