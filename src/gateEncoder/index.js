var assert = require('assert');
var BloomFilter = require('@mixmaxhq/bloom-filter');
var es = require('event-stream');

/**
 * Serializes a user gate to a form that can be deserialized and read by
 * `UserGate`.
 *
 * Passing a falsy or empty _gate_ will result in a gate that allows no users through.
 *
 * @param {Object=} gate
 *   @property {Array<String>=[]} list - An array of strings identifying the users you wish
 *     to allow through the gate (emails, user IDs, whatever). You can also stream these into
 *     the encoder (in addition to users specified here, if you like). Defaults to `[]`.
 *   @property {Number} sample - The proportion of users to allow through the gate independent
 *     of the list, as a number between 0 and 1 e.g `0.5`. See `UserGate#allows` for more information
 *     on how this is interpreted. Defaults to `0`.
 * @param {Object=} options
 *   @property {Number=0.01} listFalsePositiveRate - If _list_ is specified, this controls the rate
 *     at which users should be allowed through the gate even if they aren't on the list. `0.01` is
 *     the default (1 out of 100 users should be falsely allowed). Specifying a smaller rate will
 *     result in a larger encoded gate. 0 is unachievable.
 */
class UserGateEncoder {
  constructor(gate, options) {
    gate = gate || {};

    // We defer creating the filter from the list until the user calls `toJSON` or `toStream` to see
    // if they'll provide more users (via `toStream`) since we need to properly estimate the filter size.
    this._list = gate.list || [];
    this._sample = gate.sample || 0;

    options = options || {};
    this._listFalsePositiveRate = options.listFalsePositiveRate || 0.01;

    assert(this._listFalsePositiveRate > 0, '`listFalsePositiveRate` must be greater than 0.');
  }

  /**
   * Returns the encoded gate as JSON.
   *
   * The encoding format should be considered opaque. However, users (if any) will
   * be hashed. See the README for details of the hashing.
   *
   * @return {Object} The JSON-encoding of the gate.
   */
  toJSON() {
    if (!this._filter) {
      this._filter = this._createBloomFilter(this._list.length);
      this._list.forEach((user) => this._filter.insert(user));
    }

    var filterAsObj = this._filter.toObject();

    filterAsObj.vData = filterAsObj.vData.toJSON();

    return {
      list: filterAsObj,
      sample: this._sample
    };
  }

  /**
   * Returns a stream _to which_ you can write users, and _from which_ you can read
   * the JSON stringification of the encoded gate.
   *
   * @param {Object=} options
   *   @property {Number=0} numUsers - The estimated number of users you will write to the stream.
   *     Passing this is crucial to enforcing the desired false positive rate (see
   *     _listFalsePositiveRate_ in the constructor's documentation). Defaults to `0`.
   *   @property {Boolean=false} end - Pass `true` if you only want to use the stream to
   *     write the gate out i.e. you've already configured the users or aren't going
   *     to provide any. Defaults to `false`.
   *
   * @return {stream.Duplex}
   */
  toStream(options) {
    options = options || {};

    // Only end the stream (see below) if the client's not going to write any additional users to it.
    var endStream = options.end || false;

    var numUsers = this._list.length + (options.numUsers || 0);

    // This recreates the filter if the user had already called `toJSON`.
    this._filter = this._createBloomFilter(numUsers);

    var self = this;
    var stream = es.through(
      function write(user) {
        self._filter.insert(user);
      },
      function end() {
        this.push(JSON.stringify(self));
        this.push(null);
      });

    // Inject the initial users.
    es.readArray(this._list).pipe(stream, { end: endStream });

    return stream;
  }

  _createBloomFilter(numberOfElements) {
    // The filter must be initialized with `numberOfElements >= 1`.
    numberOfElements = numberOfElements || 1;
    return BloomFilter.create(numberOfElements, this._listFalsePositiveRate);
  }
}

module.exports = UserGateEncoder;
