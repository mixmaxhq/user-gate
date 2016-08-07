/* global require:false, module:false */
var arrayBufferToBase64 = require('./arrayBufferToBase64');

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

module.exports = UserGate;
