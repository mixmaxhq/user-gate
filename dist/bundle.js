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

	/* global require:false, module:false */
	var arrayBufferToBase64 = __webpack_require__(2);

	function UserGate(options) {
	  options = options || {};

	  this._userList = options.userList;
	  this._userSample = options.userSample;

	  this._userCharacterSet = options.userCharacterSet || 'abcdefghijklmnopqrstuvwxyz';
	}

	Object.assign(UserGate.prototype, {
	  matches: function(user) {
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
	      if (!self._userList) {
	        resolve(false);
	        return;
	      }

	      var buffer = new TextEncoder('utf-8').encode(user);
	      crypto.subtle.digest('SHA-256', buffer)
	        .then(function(hash) {
	          var base64User = arrayBufferToBase64(hash);
	          var anyUserMatches = self._userList.indexOf(base64User) > -1;
	          resolve(anyUserMatches);
	        })
	        // Can this fail? https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest does not say.
	        .catch(reject);
	    });
	  },

	  _matchesSample: function(user) {
	    var self = this;

	    return new Promise(function(resolve) {
	      if (!self._userSample) {
	        resolve(false);
	        return;
	      }

	      // See if the user begins with a character in the sample set.
	      var effectiveCharacterSet = self._userCharacterSet.slice(
	        0, Math.round(self._userCharacterSet.length * self._userSample));

	      var userMatches = new RegExp('^[' + effectiveCharacterSet + ']').test(user);
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