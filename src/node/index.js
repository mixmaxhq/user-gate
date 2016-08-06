var crypto = require('crypto');
var es = require('event-stream');
var JSONStream = require('JSONStream');

function UserGate(options) {
  options = options || {};
  this._userList = options.userList || [];
}

Object.assign(UserGate.prototype, {
  toJSON: function() {
    return {
      userList: this._userList.map(encodeUser)
    };
  },

  toStream: function(options) {
    options = options || {};

    // Only end the stream (see below) if the client's not going to write any additional users to it.
    var endStream = options.end || false;

    // Mimic the structure returned by `toJSON`. `JSONStream.stringify` will inject
    // new elements in the middle.
    var op = '{"userList":[',
        sep = ',',
        cl = ']}';

    // `es.pipeline` pipes these streams together but causes writes to go to the first
    // stream and reads to come from the last, whereas if we just returned the result of
    // `pipe` both reads and writes would target the last stream.
    var pipeline = es.pipeline(
      es.mapSync(encodeUser),
      JSONStream.stringify(op, sep, cl)
    );

    // Inject the initial users.
    es.readArray(this._userList).pipe(pipeline, { end: endStream });

    return pipeline;
  }
});

function encodeUser(user) {
  return crypto.createHash('sha256').update(user).digest('base64');
}

module.exports = UserGate;
