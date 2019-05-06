const BloomFilter = require('bloom-filter-remixed');
const sha256 = require('sha.js/sha256')

const MAX_UINT_32 = Math.pow(2, 32);

function _isFalseyVal(val) {
  return val === undefined || val === null;
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
class UserGate {
  constructor(encodedGate, options) {
  encodedGate = encodedGate || {};

  if (encodedGate.list) {
    encodedGate.list.vData = new Buffer(encodedGate.list.vData.data);
    this._list = new BloomFilter(encodedGate.list);
  }
  this._sample = encodedGate.sample;

  options = options || {};
  this._sampleCharacterSet = options.sampleCharacterSet || 'abcdefghijklmnopqrstuvwxyz';
  }

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
  allows(user) {
    // Micro-optimization: check `_matchesSample` first because it's faster.
    return this._matchesSample(user) || this._matchesList(user);
  }

  allowsUniform(user) {
    return (this._matchesUniformSample(user) || this._matchesList(user));
  }

  _matchesList(user) {
    if (!this._list) return false;

    return this._list.contains(user);
  }

  _matchesSample(user) {
    if (_isFalseyVal(this._sample) || !((this._sample >= 0) && (this._sample <= 1))) return false;

    // See if the user begins with a character in the sample set.
    const effectiveCharacterSet = this._sampleCharacterSet.slice(
      0, Math.round(this._sampleCharacterSet.length * this._sample));

    const userMatches = new RegExp('^[' + effectiveCharacterSet + ']', 'i').test(user);
    return userMatches;
  }

  _matchesUniformSample(user) {
    if (_isFalseyVal(this._sample) || !((this._sample >= 0) && (this._sample <= 1))) return false;

    // We've got to project `user` onto the sample space (i.e. convert it to a number between 0 and
    // 1) in a way that is a) deterministic b) uniform. We do this by hashing the user, converting it
    // to an unsigned 32-bit integer, and then normalizing by the size of the max UInt32--essentially
    // this solution https://stats.stackexchange.com/a/70884 but with only two buckets ("in trial",
    // or "not in trial").
    const hash = new sha256();
    const buf = hash.update(user).digest();

    // This method of conversion-to-integer will truncate the hash to the first four bytes. But hashes
    // are designed to be random in each individual bit https://crypto.stackexchange.com/a/26859, so
    // this is no less uniform--just with greater likelihood of collisions, which is fine for us since
    // we're collapsing the distribution onto two buckets anyway.
    const uint32 = Buffer.from(buf).readUInt32BE(0);

    const sample = uint32 / MAX_UINT_32;
    return sample <= this._sample;
  }
}

module.exports = UserGate;
