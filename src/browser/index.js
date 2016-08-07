function UserGate(options) {
  if (!options.userList) throw new Error('`userList` is required.');

  this._userList = options.userList;
}

Object.assign(UserGate.prototype, {
  matches: function(user) {
    return this._matchesList(user);
  },

  _matchesList: function(user) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var buffer = new TextEncoder('utf-8').encode(user);
      crypto.subtle.digest('SHA-256', buffer)
        .then(function(hash) {
          var base64User = arrayBufferToBase64(hash);
          var anyUserMatches = self._userList.indexOf(base64User) > -1;
          resolve(anyUserMatches);
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
