var crypto = require('crypto');

function UserGate(options) {
  this._userList = options.userList || [];
}

Object.assign(UserGate.prototype, {
  toJSON: function() {
    return {
      userList: this._encodedUserList()
    };
  },

  _encodedUserList: function() {
    return this._userList.map((user) => {
      return crypto.createHash('sha256').update(user).digest('base64');
    });
  }
});

module.exports = UserGate;
