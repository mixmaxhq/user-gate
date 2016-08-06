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
/***/ function(module, exports) {

	function UserGate(options) {
	  if (!options.userList) throw new Error('`userList` is required.');

	  this._userList = options.userList;
	}

	Object.assign(UserGate.prototype, {
	  matches: function(identifier) {
	    return this._matchesList(identifier);
	  },

	  _matchesList: function(identifier) {
	    var self = this;
	    return new Promise(function(resolve, reject) {
	      var buffer = new TextEncoder('utf-8').encode(identifier);
	      crypto.subtle.digest('SHA-256', buffer)
	        .then(function(hash) {
	          var base64Identifier = arrayBufferToBase64(hash);
	          var anyIdentifierMatches = self._userList.indexOf(base64Identifier) > -1;
	          resolve(anyIdentifierMatches);
	        })
	        // Can this fail? https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest does not say.
	        .catch(reject);
	    });
	  }
	});

	// http://stackoverflow.com/a/9458996/495611
	function arrayBufferToBase64(buffer) {
	  var binary = '';
	  var bytes = new Uint8Array(buffer);
	  for (var i = 0; i < bytes.byteLength; i++) {
	    binary += String.fromCharCode(bytes[i]);
	  }
	  return btoa(binary);
	}

	/* global module:false */
	module.exports = UserGate;


/***/ }
/******/ ]);