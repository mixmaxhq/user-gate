/* global require:false, module:false */
var arrayBufferToBase64 = require('./arrayBufferToBase64');

function UserGate(options) {
  options = options || {};

  this._userList = options.userList;
  this._userSample = options.userSample;

  this._userCharacterSet = options.userCharacterSet || 'abcdefghijklmnopqrstuvwxyz';
}

Object.assign(UserGate.prototype, {
  matches: function(user) {
    var self = this;

    return new Promise(function(resolve, reject) {
      // We would ideally race *for the first promise to resolve to `true`*, but I can't think of
      // how to do that elegantly.
      Promise.all([ self._matchesList(user), self._matchesSample(user) ])
        .then(function(matches) {
          resolve(matches.some(function(match) {
            return match;
          }));
        })
        .catch(reject);
    });
  },

  _matchesList: function(user) {
    var self = this;

    return new Promise(function(resolve, reject) {
      if (!self._userList) {
        resolve(false);
        return;
      }

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
  },

  _matchesSample: function(user) {
    var self = this;

    return new Promise(function(resolve) {
      if (!self._userSample) {
        resolve(false);
        return;
      }

      // See if the user begins with a character in the sample set.
      var effectiveCharacterSet = self._userCharacterSet.slice(
        0, Math.round(self._userCharacterSet.length * self._userSample));

      var userMatches = new RegExp('^[' + effectiveCharacterSet + ']').test(user);
      resolve(userMatches);
    });
  }
});

module.exports = UserGate;
