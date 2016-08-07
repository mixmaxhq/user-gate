/* global module:false */

// http://stackoverflow.com/a/9458996/495611
function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  for (var i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

module.exports = arrayBufferToBase64;
