/* jshint esnext:true */

var UserGate = require('../../src/gate');

describe('UserGate', function() {
  it('does not allow if neither `list` nor `sample` are specified', function() {
    expect(new UserGate().allows('jeff@mixmax.com')).toBe(false);
    expect(new UserGate({}).allows('jeff@mixmax.com')).toBe(false);
  });

  describe('list', function() {
    it('matches the specified user', function() {
      var gate = new UserGate({
        list: { vData: { type: 'Buffer', data: [ 113 ] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 }
      });

      expect(gate.allows('jeff@mixmax.com')).toBe(true);
      expect(gate.allows('bar@mixmax.com')).toBe(false);
    });

    it('matches multiple users', function() {
      var gate = new UserGate({
        list: { vData: { type: 'Buffer', data: [ 121, 48 ] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 }
      });

      expect(gate.allows('jeff@mixmax.com')).toBe(true);
      expect(gate.allows('bar@mixmax.com')).toBe(true);
    });
  });

  describe('sample', function() {
    it('works', function() {
      var gate = new UserGate({
        sample: 0.5
      });

      expect(gate.allows('alice@mixmax.com')).toBe(true);
      expect(gate.allows('fred@mixmax.com')).toBe(true);
      expect(gate.allows('tom@mixmax.com')).toBe(false);
      expect(gate.allows('zaina@mixmax.com')).toBe(false);
    });

    it('is case-insensitive', function() {
      var gate = new UserGate({
        sample: 0.5
      });

      expect(gate.allows('alice@mixmax.com')).toBe(true);
      expect(gate.allows('Alice@mixmax.com')).toBe(true);
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

      expect(defaultGate.allows('1')).toBe(false);
      expect(defaultGate.allows('2')).toBe(false);
      expect(numberGate.allows('1')).toBe(true);
      expect(numberGate.allows('2')).toBe(false);
    });
  });

  describe('both', function() {
    var gate = new UserGate({
      list: { vData: { type: 'Buffer', data: [ 121, 48 ] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
      sample: 0.25
    });

    it('works if user matches list and not sample', function() {
      expect(gate.allows('jeff@mixmax.com')).toBe(true);
    });

    it('works if user matches sample and not list', function() {
      expect(gate.allows('alice@mixmax.com')).toBe(true);
    });

    it('works if user matches neither', function() {
      expect(gate.allows('tom@mixmax.com')).toBe(false);
    });

    it('works if user matches both', function() {
      expect(gate.allows('bar@mixmax.com')).toBe(true);
    });
  });
});
