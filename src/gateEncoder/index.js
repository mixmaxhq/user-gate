var crypto = require('crypto');
var es = require('event-stream');
var JSONStream = require('JSONStream');

/**
 * Serializes a user gate to a form that can be deserialized and read by
 * `UserGate`.
 *
 * Passing no options will result in a gate that allows no users through.
 *
 * @param {Object=} options
 *   @property {Array<String>=} list - An array of strings identifying the users you wish
 *     to allow through the gate (emails, user IDs, whatever). You can also stream these into
 *     the encoder (in addition to users specified here, if you like). Defaults to `[]`.
 *   @property {Number} sample - The proportion of users to allow through the gate independent
 *     of the list, as a number between 0 and 1 e.g `0.5`. See `UserGate#allows` for more information
 *     on how this is interpreted. Defaults to `0`.
 */
function UserGateEncoder(options) {
  options = options || {};
  this._list = options.list || [];
  this._sample = options.sample || 0;
}

Object.assign(UserGateEncoder.prototype, {
  /**
   * Returns the encoded gate as JSON.
   *
   * The encoding format should be considered opaque. However, users (if any) will
   * be hashed using the SHA-256 algorithm.
   *
   * @return {Object} The JSON-encoding of the gate.
   */
  toJSON: function() {
    return {
      list: this._list.map(encodeUser),
      sample: this._sample
    };
  },

  /**
   * Returns a stream _to which_ you can write users, and _from which_ you can read
   * the JSON stringification of the encoded gate.
   *
   * @param {Object=} options
   *   @property {Boolean=} end - Pass `true` if you only want to use the stream to
   *     write the gate out i.e. you've already configured the users or aren't going
   *     to provide any.
   *
   * @return {stream.Duplex}
   */
  toStream: function(options) {
    options = options || {};

    // Only end the stream (see below) if the client's not going to write any additional users to it.
    var endStream = options.end || false;

    // Mimic the structure returned by `toJSON`. `JSONStream.stringify` will inject
    // new elements in the middle.
    var op = '{"list":[',
        sep = ',',
        cl = `],"sample":${this._sample}}`;

    // `es.pipeline` pipes these streams together but causes writes to go to the first
    // stream and reads to come from the last, whereas if we just returned the result of
    // `pipe` both reads and writes would target the last stream.
    var pipeline = es.pipeline(
      es.mapSync(encodeUser),
      JSONStream.stringify(op, sep, cl)
    );

    // Inject the initial users.
    es.readArray(this._list).pipe(pipeline, { end: endStream });

    return pipeline;
  }
});

function encodeUser(user) {
  return crypto.createHash('sha256').update(user).digest('base64');
}

module.exports = UserGateEncoder;
