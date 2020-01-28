var UserGate = require('../../src/gate');
const emails = require('../fixtures/emails');

describe('UserGate', function() {
  it('does not allow if neither `list` nor `sample` are specified', function() {
    expect(new UserGate().allows('jeff@mixmax.com')).toBe(false);
    expect(new UserGate({}).allows('jeff@mixmax.com')).toBe(false);
  });

  describe('list', function() {
    it('matches the specified user', function() {
      var gate = new UserGate({
        list: { vData: { type: 'Buffer', data: [113] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
      });

      expect(gate.allows('jeff@mixmax.com')).toBe(true);
      expect(gate.allows('bar@mixmax.com')).toBe(false);
    });

    it('matches multiple users', function() {
      var gate = new UserGate({
        list: { vData: { type: 'Buffer', data: [121, 48] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
      });

      expect(gate.allows('jeff@mixmax.com')).toBe(true);
      expect(gate.allows('bar@mixmax.com')).toBe(true);
    });
  });

  describe('sample', function() {
    it('works', function() {
      var gate = new UserGate({
        sample: 0.5,
      });

      expect(gate.allows('alice@mixmax.com')).toBe(true);
      expect(gate.allows('fred@mixmax.com')).toBe(true);
      expect(gate.allows('tom@mixmax.com')).toBe(false);
      expect(gate.allows('zaina@mixmax.com')).toBe(false);
    });

    it('is case-insensitive', function() {
      var gate = new UserGate({
        sample: 0.5,
      });

      expect(gate.allows('alice@mixmax.com')).toBe(true);
      expect(gate.allows('Alice@mixmax.com')).toBe(true);
    });

    it('should be deterministic', () => {
      const gate = new UserGate({ sample: 0.5 });
      const aliceIsAllowed = gate.allows('alice@mixmax.com');
      for (let i = 0; i < 1000; i++) {
        expect(gate.allows('alice@mixmax.com')).toBe(aliceIsAllowed);
      }

      const ziggyIsAllowed = gate.allows('ziggy@mixmax.com');
      for (i = 0; i < 1000; i++) {
        expect(gate.allows('ziggy@mixmax.com')).toBe(ziggyIsAllowed);
      }
    });

    it('should not allow anyone through the gate with a sample of 0', () => {
      const gate = new UserGate({ sample: 0 });
      expect(gate.allows('alice@mixmax.com')).toBe(false);
      expect(gate.allows('ziggy@mixmax.com')).toBe(false);
    });

    it('should allow anyone through the gate with a sample of 1', () => {
      const gate = new UserGate({ sample: 1 });
      expect(gate.allows('alice@mixmax.com')).toBe(true);
      expect(gate.allows('ziggy@mixmax.com')).toBe(true);
    });

    it('should be accurate', async () => {
      for (const sampleRate of [0.25, 0.5, 0.75]) {
        const sampleSize = emails.length;
        const gate = new UserGate({ sample: sampleRate });

        let inTrial = 0;
        for (const email of emails) {
          if (gate.allows(email)) {
            inTrial++;
          }
        }
        expect(inTrial / sampleSize).toBeCloseTo(sampleRate, 1);
      }
    });
  });

  describe('both', function() {
    var gate = new UserGate({
      list: { vData: { type: 'Buffer', data: [121, 48] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
      sample: 0.25,
    });

    it('works if user matches list and not sample', function() {
      expect(gate.allows('jeff@mixmax.com')).toBe(true);
    });

    it('works if user matches sample and not list', function() {
      expect(gate.allows('grace@mixmax.com')).toBe(true);
    });

    it('works if user matches neither', function() {
      expect(gate.allows('tom@mixmax.com')).toBe(false);
    });

    it('works if user matches both', function() {
      expect(gate.allows('bar@mixmax.com')).toBe(true);
    });
  });
});
