var crypto = require('crypto');
var es = require('event-stream');
var JSONStream = require('JSONStream');

function UserGateEncoder(options) {
  options = options || {};
  this._list = options.list || [];
  this._sample = options.sample || 0;
}

Object.assign(UserGateEncoder.prototype, {
  toJSON: function() {
    return {
      list: this._list.map(encodeUser),
      sample: this._sample
    };
  },

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
