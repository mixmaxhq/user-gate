/* jshint esnext:true */
/* global require:false */
require('jasmine-promises');
var UserGate = require('../../src/browser');

describe('UserGate', function() {
  it('does not match if neither `userList` nor `userSample` are specified', function() {
    return Promise.all([
      new UserGate().matches('jeff@mixmax.com'),
      new UserGate({}).matches('jeff@mixmax.com')
    ]).then(function(matches) {
      expect(matches.every((match) => !!match)).toBe(false);
    });
  });

  describe('userList', function() {
    it('matches the specified user', function() {
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

    it('matches multiple users', function() {
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

  describe('userSample', function() {
    it('works', function() {
      var gate = new UserGate({
        userSample: 0.5
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
  });

  describe('both', function() {
    var gate = new UserGate({
      userList: [
        'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
        'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
      ],
      userSample: 0.25
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
