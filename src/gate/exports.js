// TODO(jeff): Figure out how to produce a UMD module.
/* global require:false */
(function() {
  var previousUserGate = window.UserGate;

  var gate = require('.');
  window.UserGate = gate;
  window.UserGate.noConflict = function() {
    window.UserGate = previousUserGate;
    return gate;
  };
})();
