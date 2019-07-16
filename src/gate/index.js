const BloomFilter = require('@mixmaxhq/bloom-filter');
/**
 * `sha.js` is an isomorphic hashing library that implements its hashing functions synchronously.
 *  This is important for our usage of it, as we wish to support this library without resorting to
 *  browser-only or node-only APIs.
 *
 *  We could use `createHash`, which is a top level dependency of browserify's crypto polyfill -
 *  however, adding said library to this module bloats the bundle size to around 150 kb. We can
 *  avoid this by only using the hashing function we need and make use of browserify's Buffer
 *  polyfill for anything after that.
 */
const sha256 = require('sha.js/sha256');

const MAX_UINT_32 = Math.pow(2, 32);

/**
 * Deserializes a user gate and checks users against the gate.
 *
 * This is a constructor, and must be called with `new`.
 *
 * @param {Object} encodedGate - JSON produced by `UserGateEncoder`.
 * @param {Object=} options
 *   @property {float=} sample - the percentage of users we wish to let in.
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
  }

  /**
   * Checks whether _user_ (a string identifier similar to those encoded) is allowed
   * through the gate, either because:
   *
   * - they're on the list
   * - they're part of the first _sample_ users
   *
   * Sampling is done by hashing the user string and projecting it onto a sample space
   * (more on this below). This sampling technique is deterministic: a user will either
   * always be allowed through the gate, even if they reload, or they never will.
   *
   * Checking against the list requires an exact match. However, sampling is
   * case-insensitive.
   *
   * @param {String} user
   *
   * @return {Boolean} `true` if _user_ is allowed through the gate, `false` otherwise.
   */
  allows(user) {
    return this._matchesSample(user) || this._matchesList(user);
  }

  _matchesList(user) {
    if (!this._list) return false;

    return this._list.contains(user);
  }

  _matchesSample(user) {
    if ((typeof this._sample !== 'number') || !((this._sample >= 0) && (this._sample <= 1))) return false;

    if (!user) return false;

    // Allow for case insensitivity, which was a feature in V2.0 of this library.
    user = user.toLowerCase();

    // We've got to project `user` onto the sample space (i.e. convert it to a number between 0 and
    // 1) in a way that is a) deterministic b) uniform. We do this by hashing the user, converting it
    // to an unsigned 32-bit integer, and then normalizing by the size of the max UInt32--essentially
    // this solution https://stats.stackexchange.com/a/70884 but with only two buckets ("matches",
    // or "doesn't match").
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
