var es = require('event-stream');
var fs = require('fs');
var JSONStream = require('JSONStream');
var mockFs = require('mock-fs');
var UserGateEncoder = require('../../src/gateEncoder');

describe('UserGateEncoder', function() {
  afterEach(function() {
    mockFs.restore();
  });

  it('should work', function(done) {
    expect(
      new UserGateEncoder({
        list: ['jeff@mixmax.com'],
        sample: 0.25,
      }).toJSON()
    ).toEqual({
      list: { vData: { type: 'Buffer', data: [113] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
      sample: 0.25,
    });

    var gate = new UserGateEncoder({
      list: ['jeff@mixmax.com'],
      sample: 0.25,
    });

    // Explicitly end the stream since we're not going to write any additional users to it.
    gate.toStream({ end: true }).pipe(
      es.wait(function(err, jsonString) {
        if (err) {
          done.fail(err);
        } else {
          expect(JSON.parse(jsonString)).toEqual({
            list: { vData: { type: 'Buffer', data: [113] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
            sample: 0.25,
          });
          done();
        }
      })
    );
  });

  describe('list', function() {
    var emptyList = {
      vData: Object({ type: 'Buffer', data: [0] }),
      nHashFuncs: 5,
      nTweak: 0,
      nFlags: 0,
    };

    it('should encode the specified user', function() {
      expect(
        new UserGateEncoder({
          list: ['jeff@mixmax.com'],
        }).toJSON()
      ).toEqual(
        jasmine.objectContaining({
          list: { vData: { type: 'Buffer', data: [113] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
        })
      );
    });

    it('should encode multiple users', function() {
      expect(
        new UserGateEncoder({
          list: ['jeff@mixmax.com', 'bar@mixmax.com'],
        }).toJSON()
      ).toEqual(
        jasmine.objectContaining({
          list: { vData: { type: 'Buffer', data: [121, 48] }, nHashFuncs: 5, nTweak: 0, nFlags: 0 },
        })
      );
    });

    it('should default to zero users', function() {
      expect(new UserGateEncoder({ list: [] }).toJSON()).toEqual(
        jasmine.objectContaining({ list: emptyList })
      );
      expect(new UserGateEncoder({}).toJSON()).toEqual(
        jasmine.objectContaining({ list: emptyList })
      );
      expect(new UserGateEncoder().toJSON()).toEqual(jasmine.objectContaining({ list: emptyList }));
    });

    describe('streaming', function() {
      it('should handle writing an empty array to the stream', function(done) {
        var gate = new UserGateEncoder({
          list: [],
        });

        // Explicitly end the stream since we're not going to write any additional users to it.
        gate.toStream({ end: true }).pipe(
          es.wait(function(err, jsonString) {
            if (err) {
              done.fail(err);
            } else {
              expect(JSON.parse(jsonString)).toEqual(jasmine.objectContaining({ list: emptyList }));
              done();
            }
          })
        );
      });

      it('should write JSON stringification to stream', function(done) {
        var gate = new UserGateEncoder({
          list: ['jeff@mixmax.com', 'bar@mixmax.com'],
        });

        // Explicitly end the stream since we're not going to write any additional users to it.
        gate.toStream({ end: true }).pipe(
          es.wait(function(err, jsonString) {
            if (err) {
              done.fail(err);
            } else {
              expect(JSON.parse(jsonString)).toEqual(
                jasmine.objectContaining({
                  list: {
                    vData: { type: 'Buffer', data: [121, 48] },
                    nHashFuncs: 5,
                    nTweak: 0,
                    nFlags: 0,
                  },
                })
              );
              done();
            }
          })
        );
      });

      it('should read users from stream', function(done) {
        mockFs({
          'users.json': JSON.stringify(['jeff@mixmax.com', 'bar@mixmax.com']),
        });

        var gate = new UserGateEncoder();

        fs.createReadStream('users.json', 'utf8')
          .pipe(JSONStream.parse('*'))
          .pipe(gate.toStream({ numUsers: 2 }))
          .pipe(
            es.wait(function(err, jsonString) {
              if (err) {
                done.fail(err);
              } else {
                expect(JSON.parse(jsonString)).toEqual(
                  jasmine.objectContaining({
                    list: {
                      vData: { type: 'Buffer', data: [121, 48] },
                      nHashFuncs: 5,
                      nTweak: 0,
                      nFlags: 0,
                    },
                  })
                );
                done();
              }
            })
          );
      });

      it('should include initial users when reading users from stream', function(done) {
        mockFs({
          'users.json': JSON.stringify(['bar@mixmax.com']),
        });

        var gate = new UserGateEncoder({
          list: ['jeff@mixmax.com'],
        });

        fs.createReadStream('users.json', 'utf8')
          .pipe(JSONStream.parse('*'))
          .pipe(gate.toStream({ numUsers: 1 }))
          .pipe(
            es.wait(function(err, jsonString) {
              if (err) {
                done.fail(err);
              } else {
                expect(JSON.parse(jsonString)).toEqual(
                  jasmine.objectContaining({
                    list: {
                      vData: { type: 'Buffer', data: [121, 48] },
                      nHashFuncs: 5,
                      nTweak: 0,
                      nFlags: 0,
                    },
                  })
                );
                done();
              }
            })
          );
      });
    });
  });

  describe('sample', function() {
    it('should default to 0', function() {
      expect(new UserGateEncoder().toJSON()).toEqual(
        jasmine.objectContaining({
          sample: 0,
        })
      );
    });

    it('should preserve the specified number', function() {
      expect(new UserGateEncoder({ sample: 0.5 }).toJSON()).toEqual(
        jasmine.objectContaining({
          sample: 0.5,
        })
      );
    });
  });
});
