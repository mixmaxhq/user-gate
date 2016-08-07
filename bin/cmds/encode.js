var fs = require('fs');
var JSONStream = require('JSONStream');
var UserGateEncoder = require('../../src').encoder;

exports.command = 'encode <gate>';

exports.description = 'Encodes a gate';

exports.builder = function(yargs) {
  return yargs
    .options({
      list: {
        describe: 'The path to a file specifying users to encode, as a JSON array.'
      },
      sample: {
        describe: 'The proportion of users to allow independent of the list.',
        default: 0,
        type: 'number'
      }
    })
    .example('$0 encode gate.json',
      'Encodes a gate that disallows all users.')
    .example('$0 encode --list users.json gate.json',
      'Encodes a gate that allows the specified users.')
    .example('$0 encode --sample 0.5 gate.json',
      'Encodes a gate that allows half of users.')
    .example('$0 encode --list users.json --sample 0.5 gate.json',
      'Encodes a gate that allows a user if they\'re on the list or in the first half of users.');
};

exports.handler = function(argv) {
  var gateEncoder = new UserGateEncoder({
    sample: argv.sample
  });

  var listFile = argv.list;
  var encoderStream = gateEncoder.toStream({ end: !listFile });

  if (listFile) {
    fs.createReadStream(listFile, 'utf8')
      .pipe(JSONStream.parse('*'))
      .pipe(encoderStream);
  }

  encoderStream.pipe(fs.createWriteStream(argv.gate, 'utf8'));
};
