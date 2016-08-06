var crypto = require('crypto');

function encode(emails) {
  return emails.map((email) => {
    var hash = crypto.createHash('sha256');
    hash.update(email);
    return hash.digest('base64');
  });
}

module.exports = encode;
