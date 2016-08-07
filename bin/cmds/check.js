var fs = require('fs');
var UserGate = require('../../src');

exports.command = 'check <gate> <user>';

exports.description = 'Checks whether a gate allows a user.';

exports.builder = function(yargs) {
  return yargs
    .example('$0 check gate.json jeff@mixmax.com',
      'Checks whether the gate allows "jeff@mixmax.com".');
};

exports.handler = function(argv) {
  var gate;
  try {
    gate = new UserGate(JSON.parse(fs.readFileSync(argv.gate, 'utf8')));
  } catch(e) {
    console.error(`"${argv.gate}" does not represent a valid gate.`);
    return;
  }

  gate.matches(argv.user)
    .then(function(matches) {
      console.log(matches ? 'Allowed' : 'Not allowed');
    })
    .catch(function(err) {
      console.error(err);
    });
};
