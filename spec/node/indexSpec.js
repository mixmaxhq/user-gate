var UserGate = require('../../src/node');

describe('UserGate', function() {
  it('should encode the specified user', function() {
    expect(new UserGate({
      userList: ['jeff@mixmax.com']
    }).toJSON()).toEqual({
      userList: ['vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=']
    });
  });

  it('should encode multiple users', function() {
    expect(new UserGate({
      userList: ['jeff@mixmax.com', 'bar@mixmax.com']
    }).toJSON()).toEqual({
      userList: [
        'vm94x1WIA09ozQJA9VwuD1enx8ZncM8v5ztE04zGSDU=',
        'QQVkG1DSbHvP7amX9oSdmi3l+CI/ivz9lrEFyMX91gI='
      ]
    });
  });
});
