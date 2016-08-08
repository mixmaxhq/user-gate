var os = require('os');

// Webpack adds a shim for `os.platform` that returns this value.
var IS_BROWSER = os.platform() === 'browser';

var arrayBufferToBase64, crypto;
if (IS_BROWSER) {
  arrayBufferToBase64 = require('./arrayBufferToBase64');
  crypto = window.crypto;
} else {
  crypto = require('crypto');
}

function UserGate(options) {
  options = options || {};

  this._list = options.list;
  this._sample = options.sample;

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
      if (!self._list) {
        resolve(false);
        return;
      }

      Promise.resolve()
        .then(function() {
          if (IS_BROWSER) {
            var buffer = new TextEncoder('utf-8').encode(user);
            return crypto.subtle.digest('SHA-256', buffer);
          } else {
            return crypto.createHash('sha256').update(user);
          }
        })
        .then(function(hash) {
          if (IS_BROWSER) {
            return arrayBufferToBase64(hash);
          } else {
            return hash.digest('base64');
          }
        })
        .then(function(base64User) {
          var anyUserMatches = self._list.indexOf(base64User) > -1;
          resolve(anyUserMatches);
        })
        .catch(reject);
    });
  },

  _matchesSample: function(user) {
    var self = this;

    return new Promise(function(resolve) {
      if (!self._sample) {
        resolve(false);
        return;
      }

      // See if the user begins with a character in the sample set.
      var effectiveCharacterSet = self._userCharacterSet.slice(
        0, Math.round(self._userCharacterSet.length * self._sample));

      var userMatches = new RegExp('^[' + effectiveCharacterSet + ']', 'i').test(user);
      resolve(userMatches);
    });
  }
});

module.exports = UserGate;
