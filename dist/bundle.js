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

	/* WEBPACK VAR INJECTION */(function(Buffer) {var BloomFilter = __webpack_require__(6);

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

	  if (encodedGate.list) {
	    encodedGate.list.vData = new Buffer(encodedGate.list.vData.data);
	    this._list = new BloomFilter(encodedGate.list);
	  }
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
	   * @return {Boolean} `true` if _user_ is allowed through the gate, `false` otherwise.
	   */
	  allows: function(user) {
	    // Micro-optimization: check `_matchesSample` first because it's faster.
	    return this._matchesSample(user) || this._matchesList(user);
	  },

	  _matchesList: function(user) {
	    if (!this._list) return false;

	    return this._list.contains(user);
	  },

	  _matchesSample: function(user) {
	    if (!this._sample) return false;

	    // See if the user begins with a character in the sample set.
	    var effectiveCharacterSet = this._sampleCharacterSet.slice(
	      0, Math.round(this._sampleCharacterSet.length * this._sample));

	    var userMatches = new RegExp('^[' + effectiveCharacterSet + ']', 'i').test(user);
	    return userMatches;
	  }
	});

	module.exports = UserGate;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(3)
	var ieee754 = __webpack_require__(4)
	var isArray = __webpack_require__(5)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    this.length = 0
	    this.parent = undefined
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	} else {
	  // pre-set for values that may exist in the future
	  Buffer.prototype.length = undefined
	  Buffer.prototype.parent = undefined
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer, (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 4 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {};
	module.exports = __webpack_require__(7);


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';
	var mmh3 = __webpack_require__(8).v3;
	var MurmurHash3 = function(seed, data) {
	  return mmh3.x86.hash32(data, seed);
	}

	/**
	 * A Bloom Filter implemented as for use in Bitcoin Connection Bloom Filtering (BIP37) that
	 * uses version 3 of the 32-bit Murmur hash function.
	 *
	 * @see https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki
	 * @see https://github.com/bitcoin/bitcoin/blob/master/src/bloom.cpp
	 *
	 * @param {Object} data - The data object used to initialize the filter.
	 * @param {Array} data.vData - The data of the bloom filter.
	 * @param {Number} data.nHashFuncs - The number of hash functions.
	 * @param {Number} data.nTweak - A random value to seed the hash functions.
	 * @param {Number} data.nFlag - A flag to determine how matched items are added to the filter.
	 * @constructor
	 */
	function Filter(arg) {
	  /* jshint maxcomplexity: 10 */
	  if (typeof(arg) === 'object') {
	    if (!arg.vData) {
	      throw new TypeError('Data object should include filter data "vData"');
	    }
	    this.vData = new Buffer(arg.vData);
	    if (!arg.nHashFuncs) {
	      throw new TypeError('Data object should include number of hash functions "nHashFuncs"');
	    }
	    if (arg.nHashFuncs > Filter.MAX_HASH_FUNCS) {
	      throw new TypeError('"nHashFuncs" exceeded max size "' + Filter.MAX_HASH_FUNCS + '"');
	    }
	    this.nHashFuncs = arg.nHashFuncs;
	    this.nTweak = arg.nTweak || 0;
	    this.nFlags = arg.nFlags || Filter.BLOOM_UPDATE_NONE;
	  } else {
	    throw new TypeError('Unrecognized argument');
	  }
	}

	Filter.prototype.toObject = function toObject() {
	  return {
	    vData: this.vData,
	    nHashFuncs: this.nHashFuncs,
	    nTweak: this.nTweak,
	    nFlags: this.nFlags
	  };
	};

	Filter.create = function create(elements, falsePositiveRate, nTweak, nFlags) {
	  /* jshint maxstatements: 18 */

	  var info = {};

	  // The ideal size for a bloom filter with a given number of elements and false positive rate is:
	  // * - nElements * log(fp rate) / ln(2)^2
	  // See: https://github.com/bitcoin/bitcoin/blob/master/src/bloom.cpp
	  var size = -1.0 / Filter.LN2SQUARED * elements * Math.log(falsePositiveRate);
	  var filterSize = Math.floor(size / 8);
	  info.vData = new Buffer(filterSize);
	  info.vData.fill(0);

	  // The ideal number of hash functions is:
	  // filter size * ln(2) / number of elements
	  // See: https://github.com/bitcoin/bitcoin/blob/master/src/bloom.cpp
	  var nHashFuncs = Math.floor(info.vData.length * 8 / elements * Filter.LN2);
	  if (nHashFuncs > Filter.MAX_HASH_FUNCS) {
	    nHashFuncs = Filter.MAX_HASH_FUNCS;
	  }
	  if (nHashFuncs < Filter.MIN_HASH_FUNCS) {
	    nHashFuncs = Filter.MIN_HASH_FUNCS;
	  }

	  info.nHashFuncs = nHashFuncs;
	  info.nTweak = nTweak;
	  info.nFlags = nFlags;

	  return new Filter(info);

	};

	Filter.prototype.hash = function hash(nHashNum, vDataToHash) {
	  var h = MurmurHash3(nHashNum, vDataToHash);
	  return h % (this.vData.length * 8);
	};

	Filter.prototype.insert = function insert(data) {
	  for (var i = 0; i < this.nHashFuncs; i++) {
	    var index = this.hash(i, data);
	    var position = (1 << (7 & index));
	    this.vData[index >> 3] |= position;
	  }
	  return this;
	};

	/**
	 * @param {Buffer} Data to check if exists in the filter
	 * @returns {Boolean} If the data matches
	 */
	Filter.prototype.contains = function contains(data) {
	  if (!this.vData.length) {
	    return false;
	  }
	  for (var i = 0; i < this.nHashFuncs; i++) {
	    var index = this.hash(i, data);
	    if (!(this.vData[index >> 3] & (1 << (7 & index)))) {
	      return false;
	    }
	  }
	  return true;
	};

	Filter.prototype.clear = function clear() {
	  this.vData = new Buffer(this.vData.length);
	  this.vData.fill(0);
	};

	Filter.prototype.inspect = function inspect() {
	  return '<BloomFilter:' +
	    this.vData.toJSON().data + ' nHashFuncs:' +
	    this.nHashFuncs + ' nTweak:' +
	    this.nTweak + ' nFlags:' +
	    this.nFlags + '>';
	};

	Filter.BLOOM_UPDATE_NONE = 0;
	Filter.BLOOM_UPDATE_ALL = 1;
	Filter.BLOOM_UPDATE_P2PUBKEY_ONLY = 2;
	Filter.MAX_HASH_FUNCS = 50;
	Filter.MIN_HASH_FUNCS = 1;
	Filter.LN2SQUARED = Math.pow(Math.log(2), 2); // 0.4804530139182014246671025263266649717305529515945455
	Filter.LN2 = Math.log(2); // 0.6931471805599453094172321214581765680755001343602552

	module.exports = Filter;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).Buffer))

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {'use strict';

	module.exports =  {
	  v3: __webpack_require__(10)
	};

	// -- Test Code ---------------------------------------------------------
	if (__webpack_require__.c[0] === module) {
	  (function () {
	    console.log(module.exports.v3);
	  })();
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(9)(module)))

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(11);


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// +----------------------------------------------------------------------+
	// | murmurHash3.js v2.1.2 (http://github.com/karanlyons/murmurHash.js)   |
	// | A javascript implementation of MurmurHash3's x86 hashing algorithms. |
	// |----------------------------------------------------------------------|
	// | Copyright (c) 2012 Karan Lyons                                       |
	// | Freely distributable under the MIT license.                          |
	// +----------------------------------------------------------------------+


	;(function (root, undefined) {
	  'use strict';

	  // Create a local object that'll be exported or referenced globally.
	  var library = {
	    'version': '2.1.2',
	    'x86': {},
	    'x64': {}
	  };




	  // PRIVATE FUNCTIONS
	  // -----------------

	  function _x86Multiply(m, n) {
	    //
	    // Given two 32bit ints, returns the two multiplied together as a
	    // 32bit int.
	    //

	    return ((m & 0xffff) * n) + ((((m >>> 16) * n) & 0xffff) << 16);
	  }


	  function _x86Rotl(m, n) {
	    //
	    // Given a 32bit int and an int representing a number of bit positions,
	    // returns the 32bit int rotated left by that number of positions.
	    //

	    return (m << n) | (m >>> (32 - n));
	  }


	  function _x86Fmix(h) {
	    //
	    // Given a block, returns murmurHash3's final x86 mix of that block.
	    //

	    h ^= h >>> 16;
	    h  = _x86Multiply(h, 0x85ebca6b);
	    h ^= h >>> 13;
	    h  = _x86Multiply(h, 0xc2b2ae35);
	    h ^= h >>> 16;

	    return h;
	  }


	  function _x64Add(m, n) {
	    //
	    // Given two 64bit ints (as an array of two 32bit ints) returns the two
	    // added together as a 64bit int (as an array of two 32bit ints).
	    //

	    m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
	    n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
	    var o = [0, 0, 0, 0];

	    o[3] += m[3] + n[3];
	    o[2] += o[3] >>> 16;
	    o[3] &= 0xffff;

	    o[2] += m[2] + n[2];
	    o[1] += o[2] >>> 16;
	    o[2] &= 0xffff;

	    o[1] += m[1] + n[1];
	    o[0] += o[1] >>> 16;
	    o[1] &= 0xffff;

	    o[0] += m[0] + n[0];
	    o[0] &= 0xffff;

	    return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
	  }


	  function _x64Multiply(m, n) {
	    //
	    // Given two 64bit ints (as an array of two 32bit ints) returns the two
	    // multiplied together as a 64bit int (as an array of two 32bit ints).
	    //

	    m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
	    n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
	    var o = [0, 0, 0, 0];

	    o[3] += m[3] * n[3];
	    o[2] += o[3] >>> 16;
	    o[3] &= 0xffff;

	    o[2] += m[2] * n[3];
	    o[1] += o[2] >>> 16;
	    o[2] &= 0xffff;

	    o[2] += m[3] * n[2];
	    o[1] += o[2] >>> 16;
	    o[2] &= 0xffff;

	    o[1] += m[1] * n[3];
	    o[0] += o[1] >>> 16;
	    o[1] &= 0xffff;

	    o[1] += m[2] * n[2];
	    o[0] += o[1] >>> 16;
	    o[1] &= 0xffff;

	    o[1] += m[3] * n[1];
	    o[0] += o[1] >>> 16;
	    o[1] &= 0xffff;

	    o[0] += (m[0] * n[3]) + (m[1] * n[2]) + (m[2] * n[1]) + (m[3] * n[0]);
	    o[0] &= 0xffff;

	    return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
	  }


	  function _x64Rotl(m, n) {
	    //
	    // Given a 64bit int (as an array of two 32bit ints) and an int
	    // representing a number of bit positions, returns the 64bit int (as an
	    // array of two 32bit ints) rotated left by that number of positions.
	    //

	    n %= 64;

	    if (n === 32) {
	      return [m[1], m[0]];
	    }

	    else if (n < 32) {
	      return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))];
	    }

	    else {
	      n -= 32;
	      return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))];
	    }
	  }


	  function _x64LeftShift(m, n) {
	    //
	    // Given a 64bit int (as an array of two 32bit ints) and an int
	    // representing a number of bit positions, returns the 64bit int (as an
	    // array of two 32bit ints) shifted left by that number of positions.
	    //

	    n %= 64;

	    if (n === 0) {
	      return m;
	    }

	    else if (n < 32) {
	      return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n];
	    }

	    else {
	      return [m[1] << (n - 32), 0];
	    }
	  }


	  function _x64Xor(m, n) {
	    //
	    // Given two 64bit ints (as an array of two 32bit ints) returns the two
	    // xored together as a 64bit int (as an array of two 32bit ints).
	    //

	    return [m[0] ^ n[0], m[1] ^ n[1]];
	  }


	  function _x64Fmix(h) {
	    //
	    // Given a block, returns murmurHash3's final x64 mix of that block.
	    // (`[0, h[0] >>> 1]` is a 33 bit unsigned right shift. This is the
	    // only place where we need to right shift 64bit ints.)
	    //

	    h = _x64Xor(h, [0, h[0] >>> 1]);
	    h = _x64Multiply(h, [0xff51afd7, 0xed558ccd]);
	    h = _x64Xor(h, [0, h[0] >>> 1]);
	    h = _x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53]);
	    h = _x64Xor(h, [0, h[0] >>> 1]);

	    return h;
	  }




	  // PUBLIC FUNCTIONS
	  // ----------------

	  library.x86.hash32 = function (key, seed) {
	    //
	    // Given a string and an optional seed as an int, returns a 32 bit hash
	    // using the x86 flavor of MurmurHash3, as an unsigned int.
	    //

	    key = key || '';
	    seed = seed || 0;

	    var remainder = key.length % 4;
	    var bytes = key.length - remainder;

	    var h1 = seed;

	    var k1 = 0;

	    var c1 = 0xcc9e2d51;
	    var c2 = 0x1b873593;

	    for (var i = 0; i < bytes; i = i + 4) {
	      k1 = ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24);

	      k1 = _x86Multiply(k1, c1);
	      k1 = _x86Rotl(k1, 15);
	      k1 = _x86Multiply(k1, c2);

	      h1 ^= k1;
	      h1 = _x86Rotl(h1, 13);
	      h1 = _x86Multiply(h1, 5) + 0xe6546b64;
	    }

	    k1 = 0;

	    switch (remainder) {
	      case 3:
	        k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;

	      case 2:
	        k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;

	      case 1:
	        k1 ^= (key.charCodeAt(i) & 0xff);
	        k1 = _x86Multiply(k1, c1);
	        k1 = _x86Rotl(k1, 15);
	        k1 = _x86Multiply(k1, c2);
	        h1 ^= k1;
	    }

	    h1 ^= key.length;
	    h1 = _x86Fmix(h1);

	    return h1 >>> 0;
	  };


	  library.x86.hash128 = function (key, seed) {
	    //
	    // Given a string and an optional seed as an int, returns a 128 bit
	    // hash using the x86 flavor of MurmurHash3, as an unsigned hex.
	    //

	    key = key || '';
	    seed = seed || 0;

	    var remainder = key.length % 16;
	    var bytes = key.length - remainder;

	    var h1 = seed;
	    var h2 = seed;
	    var h3 = seed;
	    var h4 = seed;

	    var k1 = 0;
	    var k2 = 0;
	    var k3 = 0;
	    var k4 = 0;

	    var c1 = 0x239b961b;
	    var c2 = 0xab0e9789;
	    var c3 = 0x38b34ae5;
	    var c4 = 0xa1e38b93;

	    for (var i = 0; i < bytes; i = i + 16) {
	      k1 = ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24);
	      k2 = ((key.charCodeAt(i + 4) & 0xff)) | ((key.charCodeAt(i + 5) & 0xff) << 8) | ((key.charCodeAt(i + 6) & 0xff) << 16) | ((key.charCodeAt(i + 7) & 0xff) << 24);
	      k3 = ((key.charCodeAt(i + 8) & 0xff)) | ((key.charCodeAt(i + 9) & 0xff) << 8) | ((key.charCodeAt(i + 10) & 0xff) << 16) | ((key.charCodeAt(i + 11) & 0xff) << 24);
	      k4 = ((key.charCodeAt(i + 12) & 0xff)) | ((key.charCodeAt(i + 13) & 0xff) << 8) | ((key.charCodeAt(i + 14) & 0xff) << 16) | ((key.charCodeAt(i + 15) & 0xff) << 24);

	      k1 = _x86Multiply(k1, c1);
	      k1 = _x86Rotl(k1, 15);
	      k1 = _x86Multiply(k1, c2);
	      h1 ^= k1;

	      h1 = _x86Rotl(h1, 19);
	      h1 += h2;
	      h1 = _x86Multiply(h1, 5) + 0x561ccd1b;

	      k2 = _x86Multiply(k2, c2);
	      k2 = _x86Rotl(k2, 16);
	      k2 = _x86Multiply(k2, c3);
	      h2 ^= k2;

	      h2 = _x86Rotl(h2, 17);
	      h2 += h3;
	      h2 = _x86Multiply(h2, 5) + 0x0bcaa747;

	      k3 = _x86Multiply(k3, c3);
	      k3 = _x86Rotl(k3, 17);
	      k3 = _x86Multiply(k3, c4);
	      h3 ^= k3;

	      h3 = _x86Rotl(h3, 15);
	      h3 += h4;
	      h3 = _x86Multiply(h3, 5) + 0x96cd1c35;

	      k4 = _x86Multiply(k4, c4);
	      k4 = _x86Rotl(k4, 18);
	      k4 = _x86Multiply(k4, c1);
	      h4 ^= k4;

	      h4 = _x86Rotl(h4, 13);
	      h4 += h1;
	      h4 = _x86Multiply(h4, 5) + 0x32ac3b17;
	    }

	    k1 = 0;
	    k2 = 0;
	    k3 = 0;
	    k4 = 0;

	    switch (remainder) {
	      case 15:
	        k4 ^= key.charCodeAt(i + 14) << 16;

	      case 14:
	        k4 ^= key.charCodeAt(i + 13) << 8;

	      case 13:
	        k4 ^= key.charCodeAt(i + 12);
	        k4 = _x86Multiply(k4, c4);
	        k4 = _x86Rotl(k4, 18);
	        k4 = _x86Multiply(k4, c1);
	        h4 ^= k4;

	      case 12:
	        k3 ^= key.charCodeAt(i + 11) << 24;

	      case 11:
	        k3 ^= key.charCodeAt(i + 10) << 16;

	      case 10:
	        k3 ^= key.charCodeAt(i + 9) << 8;

	      case 9:
	        k3 ^= key.charCodeAt(i + 8);
	        k3 = _x86Multiply(k3, c3);
	        k3 = _x86Rotl(k3, 17);
	        k3 = _x86Multiply(k3, c4);
	        h3 ^= k3;

	      case 8:
	        k2 ^= key.charCodeAt(i + 7) << 24;

	      case 7:
	        k2 ^= key.charCodeAt(i + 6) << 16;

	      case 6:
	        k2 ^= key.charCodeAt(i + 5) << 8;

	      case 5:
	        k2 ^= key.charCodeAt(i + 4);
	        k2 = _x86Multiply(k2, c2);
	        k2 = _x86Rotl(k2, 16);
	        k2 = _x86Multiply(k2, c3);
	        h2 ^= k2;

	      case 4:
	        k1 ^= key.charCodeAt(i + 3) << 24;

	      case 3:
	        k1 ^= key.charCodeAt(i + 2) << 16;

	      case 2:
	        k1 ^= key.charCodeAt(i + 1) << 8;

	      case 1:
	        k1 ^= key.charCodeAt(i);
	        k1 = _x86Multiply(k1, c1);
	        k1 = _x86Rotl(k1, 15);
	        k1 = _x86Multiply(k1, c2);
	        h1 ^= k1;
	    }

	    h1 ^= key.length;
	    h2 ^= key.length;
	    h3 ^= key.length;
	    h4 ^= key.length;

	    h1 += h2;
	    h1 += h3;
	    h1 += h4;
	    h2 += h1;
	    h3 += h1;
	    h4 += h1;

	    h1 = _x86Fmix(h1);
	    h2 = _x86Fmix(h2);
	    h3 = _x86Fmix(h3);
	    h4 = _x86Fmix(h4);

	    h1 += h2;
	    h1 += h3;
	    h1 += h4;
	    h2 += h1;
	    h3 += h1;
	    h4 += h1;

	    return ("00000000" + (h1 >>> 0).toString(16)).slice(-8) + ("00000000" + (h2 >>> 0).toString(16)).slice(-8) + ("00000000" + (h3 >>> 0).toString(16)).slice(-8) + ("00000000" + (h4 >>> 0).toString(16)).slice(-8);
	  };


	  library.x64.hash128 = function (key, seed) {
	    //
	    // Given a string and an optional seed as an int, returns a 128 bit
	    // hash using the x64 flavor of MurmurHash3, as an unsigned hex.
	    //

	    key = key || '';
	    seed = seed || 0;

	    var remainder = key.length % 16;
	    var bytes = key.length - remainder;

	    var h1 = [0, seed];
	    var h2 = [0, seed];

	    var k1 = [0, 0];
	    var k2 = [0, 0];

	    var c1 = [0x87c37b91, 0x114253d5];
	    var c2 = [0x4cf5ad43, 0x2745937f];

	    for (var i = 0; i < bytes; i = i + 16) {
	      k1 = [((key.charCodeAt(i + 4) & 0xff)) | ((key.charCodeAt(i + 5) & 0xff) << 8) | ((key.charCodeAt(i + 6) & 0xff) << 16) | ((key.charCodeAt(i + 7) & 0xff) << 24), ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24)];
	      k2 = [((key.charCodeAt(i + 12) & 0xff)) | ((key.charCodeAt(i + 13) & 0xff) << 8) | ((key.charCodeAt(i + 14) & 0xff) << 16) | ((key.charCodeAt(i + 15) & 0xff) << 24), ((key.charCodeAt(i + 8) & 0xff)) | ((key.charCodeAt(i + 9) & 0xff) << 8) | ((key.charCodeAt(i + 10) & 0xff) << 16) | ((key.charCodeAt(i + 11) & 0xff) << 24)];

	      k1 = _x64Multiply(k1, c1);
	      k1 = _x64Rotl(k1, 31);
	      k1 = _x64Multiply(k1, c2);
	      h1 = _x64Xor(h1, k1);

	      h1 = _x64Rotl(h1, 27);
	      h1 = _x64Add(h1, h2);
	      h1 = _x64Add(_x64Multiply(h1, [0, 5]), [0, 0x52dce729]);

	      k2 = _x64Multiply(k2, c2);
	      k2 = _x64Rotl(k2, 33);
	      k2 = _x64Multiply(k2, c1);
	      h2 = _x64Xor(h2, k2);

	      h2 = _x64Rotl(h2, 31);
	      h2 = _x64Add(h2, h1);
	      h2 = _x64Add(_x64Multiply(h2, [0, 5]), [0, 0x38495ab5]);
	    }

	    k1 = [0, 0];
	    k2 = [0, 0];

	    switch(remainder) {
	      case 15:
	        k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 14)], 48));

	      case 14:
	        k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 13)], 40));

	      case 13:
	        k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 12)], 32));

	      case 12:
	        k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 11)], 24));

	      case 11:
	        k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 10)], 16));

	      case 10:
	        k2 = _x64Xor(k2, _x64LeftShift([0, key.charCodeAt(i + 9)], 8));

	      case 9:
	        k2 = _x64Xor(k2, [0, key.charCodeAt(i + 8)]);
	        k2 = _x64Multiply(k2, c2);
	        k2 = _x64Rotl(k2, 33);
	        k2 = _x64Multiply(k2, c1);
	        h2 = _x64Xor(h2, k2);

	      case 8:
	        k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 7)], 56));

	      case 7:
	        k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 6)], 48));

	      case 6:
	        k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 5)], 40));

	      case 5:
	        k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 4)], 32));

	      case 4:
	        k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 3)], 24));

	      case 3:
	        k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 2)], 16));

	      case 2:
	        k1 = _x64Xor(k1, _x64LeftShift([0, key.charCodeAt(i + 1)], 8));

	      case 1:
	        k1 = _x64Xor(k1, [0, key.charCodeAt(i)]);
	        k1 = _x64Multiply(k1, c1);
	        k1 = _x64Rotl(k1, 31);
	        k1 = _x64Multiply(k1, c2);
	        h1 = _x64Xor(h1, k1);
	    }

	    h1 = _x64Xor(h1, [0, key.length]);
	    h2 = _x64Xor(h2, [0, key.length]);

	    h1 = _x64Add(h1, h2);
	    h2 = _x64Add(h2, h1);

	    h1 = _x64Fmix(h1);
	    h2 = _x64Fmix(h2);

	    h1 = _x64Add(h1, h2);
	    h2 = _x64Add(h2, h1);

	    return ("00000000" + (h1[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (h1[1] >>> 0).toString(16)).slice(-8) + ("00000000" + (h2[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (h2[1] >>> 0).toString(16)).slice(-8);
	  };




	  // INITIALIZATION
	  // --------------

	  // Export murmurHash3 for CommonJS, either as an AMD module or just as part
	  // of the global object.
	  if (true) {
	    if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = library;
	    }

	    exports.murmurHash3 = library;
	  }

	  else if (typeof define === 'function' && define.amd) {
	    define([], function() {
	      return library;
	    });
	  }

	  else {
	    // Use murmurHash3.noConflict to restore `murmurHash3` back to its
	    // original value. Returns a reference to the library object, to allow
	    // it to be used under a different name.
	    library._murmurHash3 = root.murmurHash3

	    library.noConflict = function () {
	      root.murmurHash3 = library._murmurHash3;
	      library._murmurHash3 = undefined;
	      library.noConflict = undefined;

	      return library;
	    };

	    root.murmurHash3 = library;
	  }
	})(this);


/***/ }
/******/ ]);