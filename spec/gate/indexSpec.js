/* jshint esnext:true */

// Make `jasmine-promises` compatible with Node:
// https://github.com/matthewjh/jasmine-promises/issues/8#issue-135438525
if (!global.jasmineRequire) {
  global.jasmineRequire = {
    interface: function() {}
  };
}
require('jasmine-promises');

var UserGate = require('../../src/gate');

describe('UserGate', function() {
  it('does not match if neither `list` nor `sample` are specified', function() {
    return Promise.all([
      new UserGate().matches('jeff@mixmax.com'),
      new UserGate({}).matches('jeff@mixmax.com')
    ]).then(function(matches) {
      expect(matches.every((match) => !!match)).toBe(false);
    });
  });

  describe('list', function() {
    it('matches the specified user', function() {
      var gate = new UserGate({
        list: ['vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=']
      });

      return Promise.all([
        gate.matches('jeff@mixmax.com'),
        gate.matches('bar@mixmax.com')
      ]).then(function(matches) {
        expect(matches).toEqual([true, false]);
      });
    });

    it('matches multiple users', function() {
      var gate = new UserGate({
        list: [
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

  describe('sample', function() {
    it('works', function() {
      var gate = new UserGate({
        sample: 0.5
      });

      return Promise.all([
        gate.matches('alice@mixmax.com'),
        gate.matches('fred@mixmax.com'),
        gate.matches('tom@mixmax.com'),
        gate.matches('zaina@mixmax.com')
      ]).then(function(matches) {
        expect(matches).toEqual([true, true, false, false]);
      });
    });

    it('is case-insensitive', function() {
      var gate = new UserGate({
        sample: 0.5
      });

      return Promise.all([
        gate.matches('alice@mixmax.com'),
        gate.matches('Alice@mixmax.com')
      ]).then(function(matches) {
        expect(matches).toEqual([true, true]);
      });
    });

    it('allows the character set to be configured', function() {
      var defaultGate = new UserGate({
        sample: 0.5
      });

      var numberGate = new UserGate({
        sample: 0.5,
      }, {
        sampleCharacterSet: '12'
      });

      return Promise.all([
        defaultGate.matches('1'),
        defaultGate.matches('2'),
        numberGate.matches('1'),
        numberGate.matches('2')
      ]).then(function(matches) {
        expect(matches).toEqual([false, false, true, false]);
      });
    });
  });

  describe('both', function() {
    var gate = new UserGate({
      list: [
        'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
        'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
      ],
      sample: 0.25
    });

    it('works if user matches list and not sample', function() {
      return gate.matches('jeff@mixmax.com')
        .then(function(matches) {
          expect(matches).toBe(true);
        });
    });

    it('works if user matches sample and not list', function() {
      return gate.matches('alice@mixmax.com')
        .then(function(matches) {
          expect(matches).toBe(true);
        });
    });

    it('works if user matches neither', function() {
      return gate.matches('tom@mixmax.com')
        .then(function(matches) {
          expect(matches).toBe(false);
        });
    });

    it('works if user matches both', function() {
      return gate.matches('bar@mixmax.com')
        .then(function(matches) {
          expect(matches).toBe(true);
        });
    });
  });
});
