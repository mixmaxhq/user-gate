var assert = require('assert');
var fs = require('fs');
var JSONStream = require('JSONStream');
var UserGateEncoder = require('../../src').encoder;

exports.command = 'encode <gate>';

exports.description = 'Encodes a gate';

exports.builder = function(yargs) {
  return yargs
    .options({
      list: {
        describe: 'The path to a file specifying users to encode, as a JSON array.',
      },
      'list-size': {
        describe: 'The estimated size of the list.',
        type: 'number',
      },
      sample: {
        describe: 'The proportion of users to allow independent of the list.',
        default: 0,
        type: 'number',
      },
      'false-positive-rate': {
        describe: 'The false positive rate for allowing users that are not on the list.',
        default: 0.01,
        type: 'number',
      },
    })
    .example('$0 encode gate.json', 'Encodes a gate that disallows all users.')
    .example(
      '$0 encode --list users.json --list-size 1000 --false-positive-rate 0.005 gate.json',
      'Encodes a gate that allows the specified ~1000 users with a false positive rate of 0.5%.'
    )
    .example('$0 encode --sample 0.5 gate.json', 'Encodes a gate that allows half of users.')
    .example(
      '$0 encode --list users.json --list-size 1000 --sample 0.5 gate.json',
      "Encodes a gate that allows a user if they're on the list or in the first half of users."
    );
};

exports.handler = function(argv) {
  var gateEncoder = new UserGateEncoder({
    sample: argv.sample,
    listFalsePositiveRate: argv['false-positive-rate'],
  });

  var listFile = argv.list;
  var listSize = argv['list-size'];
  if (listFile) {
    assert(listSize, `You must specify the estimated size of "${listFile}" using --list-size.`);
  }
  var encoderStream = gateEncoder.toStream({ numUsers: listSize, end: !listFile });

  if (listFile) {
    fs.createReadStream(listFile, 'utf8')
      .pipe(JSONStream.parse('*'))
      .pipe(encoderStream);
  }

  encoderStream.pipe(fs.createWriteStream(argv.gate, 'utf8'));
};
