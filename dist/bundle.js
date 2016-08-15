/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	// TODO(jeff): Figure out how to produce a UMD module.
	/* global require:false */
	(function() {
	  var previousUserGate = window.UserGate;

	  var gate = __webpack_require__(1);
	  window.UserGate = gate;
	  window.UserGate.noConflict = function() {
	    window.UserGate = previousUserGate;
	    return gate;
	  };
	})();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* global IS_BROWSER:true */
	if (false) IS_BROWSER = false;

	var arrayBufferToBase64, crypto;
	if (true) {
	  arrayBufferToBase64 = __webpack_require__(2);
	  crypto = window.crypto;
	} else {
	  crypto = require('crypto');
	}

	/**
	 * Deserializes a user gate and checks users against the gate.
	 *
	 * This is a constructor, and must be called with `new`.
	 *
	 * @param {Object} encodedGate - JSON produced by `UserGateEncoder`.
	 * @param {Object=} options
	 *   @property {String=} _sampleCharacterSet_: The string of characters with which the unencoded
	 *     user identifiers could begin. Defaults to `'abcdefghijklmnopqrstuvwxyz'` which works for
	 *     identifiers that are emails. Case-insensitive. See `UserGate#allows` for how this is used.
	 */
	function UserGate(encodedGate, options) {
	  encodedGate = encodedGate || {};
	  this._list = encodedGate.list;
	  this._sample = encodedGate.sample;

	  options = options || {};
	  this._sampleCharacterSet = options.sampleCharacterSet || 'abcdefghijklmnopqrstuvwxyz';
	}

	Object.assign(UserGate.prototype, {
	  /**
	   * Checks whether _user_ (a string identifier similar to those encoded) is allowed
	   * through the gate, either because:
	   *
	   * - they're on the list
	   * - they're part of the first _sample_ users
	   *
	   * Sampling is done by checking the character with which _user_ begins. For example,
	   * if _sample_ is `0.5` and the gate uses the default _sampleCharacterSet_, _user_ would be
	   * allowed through the gate if it began with any character between `a-n` (halfway through
	   * the alphabet).
	   *
	   * Users are unlikely to be uniformly distributed over _sampleCharacterSet_ and
	   * thus a _sample_ of `0.5` won't exactly select for 50% of users. However, this
	   * sampling technique is deterministic: a user will either always be allowed through
	   * the gate, even if they reload, or they never will.
	   *
	   * Checking against the list requires an exact match. However, sampling is
	   * case-insensitive.
	   *
	   * @param {String} user
	   *
	   * @return {Promise} Resolves to `true` if _user_ is allowed through the gate, `false` otherwise.
	   */
	  allows: function(user) {
	    var self = this;

	    return new Promise(function(resolve, reject) {
	      // We would ideally race *for the first promise to resolve to `true`*, but I can't think of
	      // how to do that elegantly.
	      Promise.all([ self._matchesList(user), self._matchesSample(user) ])
	        .then(function(matches) {
	          resolve(matches.some(function(match) {
	            return match;
	          }));
	        })
	        .catch(reject);
	    });
	  },

	  _matchesList: function(user) {
	    var self = this;

	    return new Promise(function(resolve, reject) {
	      if (!self._list) {
	        resolve(false);
	        return;
	      }

	      Promise.resolve()
	        .then(function() {
	          if (true) {
	            var buffer = new TextEncoder('utf-8').encode(user);
	            return crypto.subtle.digest('SHA-256', buffer);
	          } else {
	            return crypto.createHash('sha256').update(user);
	          }
	        })
	        .then(function(hash) {
	          if (true) {
	            return arrayBufferToBase64(hash);
	          } else {
	            return hash.digest('base64');
	          }
	        })
	        .then(function(base64User) {
	          var anyUserMatches = self._list.indexOf(base64User) > -1;
	          resolve(anyUserMatches);
	        })
	        .catch(reject);
	    });
	  },

	  _matchesSample: function(user) {
	    var self = this;

	    return new Promise(function(resolve) {
	      if (!self._sample) {
	        resolve(false);
	        return;
	      }

	      // See if the user begins with a character in the sample set.
	      var effectiveCharacterSet = self._sampleCharacterSet.slice(
	        0, Math.round(self._sampleCharacterSet.length * self._sample));

	      var userMatches = new RegExp('^[' + effectiveCharacterSet + ']', 'i').test(user);
	      resolve(userMatches);
	    });
	  }
	});

	module.exports = UserGate;


/***/ },
/* 2 */
/***/ function(module, exports) {

	/* global module:false */

	// http://stackoverflow.com/a/9458996/495611
	function arrayBufferToBase64(buffer) {
	  var binary = '';
	  var bytes = new Uint8Array(buffer);
	  for (var i = 0; i < bytes.byteLength; i++) {
	    binary += String.fromCharCode(bytes[i]);
	  }
	  return btoa(binary);
	}

	module.exports = arrayBufferToBase64;


/***/ }
/******/ ]);