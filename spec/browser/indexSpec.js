/* global require:false */
require('jasmine-promises');
var UserGate = require('../../src/browser');

describe('UserGate', function() {
  it('throws if `userList` is not specified', function() {
    expect(function() {
      new UserGate();
    }).toThrow();

    expect(function() {
      new UserGate({});
    }).toThrow();
  });

  describe('matches', function() {
    it('matches the specified identifier', function() {
      var gate = new UserGate({
        userList: ['vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=']
      });

      return Promise.all([
        gate.matches('jeff@mixmax.com'),
        gate.matches('bar@mixmax.com')
      ]).then(function(matches) {
        expect(matches).toEqual([true, false]);
      });
    });

    it('matches multiple identifiers', function() {
      var gate = new UserGate({
        userList: [
          'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
          'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
        ]
      });

      return Promise.all([
        gate.matches('jeff@mixmax.com'),
        gate.matches('bar@mixmax.com')
      ]).then(function(matches) {
        expect(matches).toEqual([true, true]);
      });
    });
  });
});
