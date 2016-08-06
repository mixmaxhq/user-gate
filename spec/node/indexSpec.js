var encode = require('../../src/node');

describe('encode', function() {
  it('should encode the specified identifier', function() {
    expect(encode(['jeff@mixmax.com'])).toEqual(['vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=']);
  });

  it('should encode multiple identifiers', function() {
    expect(encode(['jeff@mixmax.com', 'bar@mixmax.com'])).toEqual([
      'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
      'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
    ]);
  });
});
