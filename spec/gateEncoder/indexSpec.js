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
    expect(new UserGateEncoder({
      list: ['jeff@mixmax.com'],
      sample: 0.25
    }).toJSON()).toEqual({
      list: ['vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU='],
      sample: 0.25
    });

    var gate = new UserGateEncoder({
      list: ['jeff@mixmax.com'],
      sample: 0.25
    });

    // Explicitly end the stream since we're not going to write any additional users to it.
    gate.toStream({ end: true })
      .pipe(es.wait(function(err, jsonString) {
        if (err) {
          done.fail(err);
        } else {
          expect(JSON.parse(jsonString)).toEqual(({
            list: [
              'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU='
            ],
            sample: 0.25
          }));
          done();
        }
      }));
  });

  describe('list', function() {
    it('should encode the specified user', function() {
      expect(new UserGateEncoder({
        list: ['jeff@mixmax.com']
      }).toJSON()).toEqual(jasmine.objectContaining({
        list: ['vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=']
      }));
    });

    it('should encode multiple users', function() {
      expect(new UserGateEncoder({
        list: ['jeff@mixmax.com', 'bar@mixmax.com']
      }).toJSON()).toEqual(jasmine.objectContaining({
        list: [
          'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
          'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
        ]
      }));
    });

    it('should default to zero users', function() {
      expect(new UserGateEncoder({ list: [] }).toJSON()).toEqual(jasmine.objectContaining({ list: [] }));
      expect(new UserGateEncoder({}).toJSON()).toEqual(jasmine.objectContaining({ list: [] }));
      expect(new UserGateEncoder().toJSON()).toEqual(jasmine.objectContaining({ list: [] }));
    });

    describe('streaming', function() {
      it('should handle writing an empty array to the stream', function(done) {
        var gate = new UserGateEncoder({
          list: []
        });

        // Explicitly end the stream since we're not going to write any additional users to it.
        gate.toStream({ end: true })
          .pipe(es.wait(function(err, jsonString) {
            if (err) {
              done.fail(err);
            } else {
              expect(JSON.parse(jsonString)).toEqual(jasmine.objectContaining({ list: [] }));
              done();
            }
          }));
      });

      it('should write JSON stringification to stream', function(done) {
        var gate = new UserGateEncoder({
          list: ['jeff@mixmax.com', 'bar@mixmax.com']
        });

        // Explicitly end the stream since we're not going to write any additional users to it.
        gate.toStream({ end: true })
          .pipe(es.wait(function(err, jsonString) {
            if (err) {
              done.fail(err);
            } else {
              expect(JSON.parse(jsonString)).toEqual(jasmine.objectContaining({
                list: [
                  'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
                  'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
                ]
              }));
              done();
            }
          }));
      });

      it('should read users from stream', function(done) {
        mockFs({
          'users.json': JSON.stringify(['jeff@mixmax.com', 'bar@mixmax.com'])
        });

        var gate = new UserGateEncoder();

        fs.createReadStream('users.json', 'utf8')
          .pipe(JSONStream.parse('*'))
          .pipe(gate.toStream())
          .pipe(es.wait(function(err, jsonString) {
            if (err) {
              done.fail(err);
            } else {
              expect(JSON.parse(jsonString)).toEqual(jasmine.objectContaining({
                list: [
                  'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
                  'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
                ]
              }));
              done();
            }
          }));
      });

      it('should include initial users when reading users from stream', function(done) {
        mockFs({
          'users.json': JSON.stringify(['bar@mixmax.com'])
        });

        var gate = new UserGateEncoder({
          list: ['jeff@mixmax.com']
        });

        fs.createReadStream('users.json', 'utf8')
          .pipe(JSONStream.parse('*'))
          .pipe(gate.toStream())
          .pipe(es.wait(function(err, jsonString) {
            if (err) {
              done.fail(err);
            } else {
              expect(JSON.parse(jsonString)).toEqual(jasmine.objectContaining({
                list: [
                  'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
                  'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
                ]
              }));
              done();
            }
          }));
      });
    });
  });

  describe('sample', function() {
    it('should default to 0', function() {
      expect(new UserGateEncoder().toJSON()).toEqual(jasmine.objectContaining({
        sample: 0
      }));
    });

    it('should preserve the specified number', function() {
      expect(new UserGateEncoder({ sample: 0.5 }).toJSON()).toEqual(jasmine.objectContaining({
        sample: 0.5
      }));
    });
  });
});
