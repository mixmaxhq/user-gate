var BloomFilter = require('bloom-filter-remixed');

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
