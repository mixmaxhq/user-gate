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
