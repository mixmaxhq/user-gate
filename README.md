# user-gate

This project lets you define server-less feature gates without compromising
users' privacy. It comes in two parts:

* a Node module / CLI tool that let you encode a list of users
* a browser module that lets you check whether a user is on the list

Since the users are encoded (using SHA-256 hashing), you can ship the whole list
to the client without exposing your users' information.

This is useful in scenarios where you can't or don't want to define server logic
to implement such a feature gate.

Additional features:

* You can check if the user is on the list from Node too (though this is primarily
for the benefit of the CLI tool)
* You can let a certain proportion i.e. 50% of users through the gate, independent
of the list, and deterministically (user X will always be allowed through the gate
even if they reload).

## Installation

For encoding the list:

```sh
# As part of some JS build process:
npm install user-gate --save-dev

# Using the CLI tool:
npm install user-gate -g
```

For checking the list:

```sh
# In the browser:
bower install user-gate --save

# From Node:
npm install user-gate --save

# Using the CLI tool:
npm install user-gate -g
```

## Usage

### Encoding the list

Let's say that you have a list of users like

```js
// users.json
[
  "jeff@mixmax.com",
  "bob@mixmax.com"
]
```

(These could be any sort of strings, emails or user IDs or whatever.)

You can encode this list using `user-gate`'s Node API or using the CLI tool. Using the
Node API:

```js
var UserGateEncoder = require('user-gate').encoder;

var gateEncoder = new UserGateEncoder({
  users: JSON.parse(fs.readFileSync('users.json', 'utf8')),
  sample: 0.5
});

// `JSON.stringify` calls `toJSON` on the encoder.
fs.writeFileSync('gate.json', JSON.stringify(gateEncoder));
```

You can also encode the list as part of a streaming workflow e.g. a
[Gulp](http://gulpjs.com/) task that publishes the feature gate to Cloudfront:

```js
var argv = require('yargs').argv;
var awspublish = require('gulp-awspublish');
var JSONStream = require('JSONStream');
var rename = require('gulp-rename');
var UserGateEncoder = require('user-gate').encoder;

gulp.task('updateGate', function() {
  var publisher = awspublish.create(/* configuration omitted */);

  var gateEncoder = new UserGateEncoder({
    // We don't specify `users` here because the encoder reads the list from the
    // JSON stream below.
    sample: 0.5
  });

  return gulp.src(argv.users)
    .pipe(JSONStream.parse('*'))
    .pipe(gateEncoder.toStream())
    .pipe(rename('gate.json'))
    .pipe(publisher.publish());
})
```

Or you can encode the list using the CLI tool:

```sh
user-gate encode --list users.json --sample 0.5 gate.json
```

### Checking the list

In the browser:

```html
<!-- Loads `UserGate` into `window`. There is also a minified version available, `dist/bundle.min.js`.
If anyone would like to produce a UMD version, a pull request would be very welcome! -->
<script src="bower_components/user-gate/dist/bundle.js"></script>

<script type="text/javascript">
  // Assuming that you have jQuery for the purposes of this example.
  $.getJSON('gate.json')
    .then(function(json) {
      var gate = new UserGate(json);
      return Promise.all([
        gate.allows('jeff@mixmax.com'),
        gate.allows('walt@mixmax.com'),
        gate.allows('alice@mixmax.com')
      ]);
    })
    .then(function(allowed) {
      // Logs "[true, false, true]":
      // - jeff@mixmax.com was on the list
      // - walt@mixmax.com was not on the list
      // - alice@mixmax.com was not on the list, but is in the first half of users.
      console.log(allowed);
    })
    .catch(function(err) {
      console.error(err);
    });
</script>
```

You can also check the list from Node:

```js
var gate = new UserGate(JSON.parse(fs.readFileSync('gate.json', 'utf8')));
gate.allows('jeff@mixmax.com')
  .then(function(allowed) {
    console.log(allowed); // Logs "true"
  })
  .catch(function(err) {
    console.error(err);
  })
```

Or from the CLI tool:

```sh
# Prints 'Allowed'
user-gate check gate.json jeff@mixmax.com
```

## Documentation

### UserGateEncoder

Available as `require('user-gate').encoder`.

Serializes a user gate to a form that can be deserialized and read by
[`UserGate`](#usergate).

#### new UserGateEncoder(options)

This is a constructor, and must be called with `new`.

Options:

- _list_: An array of strings identifying the users you wish to allow through
  the gate (emails, user IDs, whatever). You can also [stream these](#usergateencodertostreamoptions)
  into the encoder (in addition to users specified here, if you like).
  Defaults to `[]`.
- _sample_: The proportion of users to allow through the gate independent of the
  list, as a number between 0 and 1 e.g `0.5`. See [`UserGate#allows`](#usergateallowsuser)
  for more information on how this is interpreted. Defaults to `0`.

Passing no options will result in a gate that allows no users through.

#### UserGateEncoder#toJSON()

Returns the encoded gate as JSON.

The encoding format should be considered opaque. However, users (if any) will
be hashed using the SHA-256 algorithm.

#### UserGateEncoder#toStream(options)

Returns a stream _to which_ you can write users, and _from which_ you can read
the JSON stringification of the encoded gate:

```js
var fs = require('fs');
var JSONStream = require('JSONStream');
var UserGateEncoder = require('user-gate').encoder;

fs.createReadStream('users.json')
  .pipe(JSONStream.parse('*'))
  .pipe(new UserGateEncoder().toStream())
  .pipe(fs.createWriteStream('gate.json'));
```

Pass `{ end: true }` if you only want to use the stream to write the gate out
i.e. you've already configured the users or aren't going to provide any:

```js
var fs = require('fs');
var UserGateEncoder = require('user-gate').encoder;

var gateEncoder = new UserGateEncoder({sample: 0.5});

gateEncoder.toStream({end: true})
  .pipe(fs.createWriteStream('gate.json'));
```

### UserGate

Available as `require('user-gate')` in Node, or as `window.UserGate` in the browser.

Deserializes a user gate and checks users against the gate.

#### new UserGate(encodedGate, options)

This is a constructor, and must be called with `new`.

_encodedGate_ is JSON produced by [`UserGateEncoder`](#usergateencoder).

Options:

* _sampleCharacterSet_: The string of characters with which the unencoded user
identifiers could begin. Defaults to `'abcdefghijklmnopqrstuvwxyz'` which works
for identifiers that are emails. Case-insensitive. See
[`UserGate#allows`](#usergateallowsuser) for how this is used.

#### UserGate#allows(user)

Checks whether _user_ (a string identifier similar to those encoded) is allowed
through the gate, either because:

* they're on the list
* they're part of the first _sample_ users

Sampling is done by checking the character with which _user_ begins. For example,
if _sample_ is `0.5` and the gate uses the default
[_sampleCharacterSet_](#newusergateencodedgate-options), _user_ would be allowed
through the gate if it began with any character between `a-n` (halfway through
the alphabet).

Users are unlikely to be uniformly distributed over _sampleCharacterSet_ and
thus a _sample_ of `0.5` won't exactly select for 50% of users. However, this
sampling technique is deterministic: a user will either always be allowed through
the gate, even if they reload, or they never will.

Checking against the list requires an exact match. However, sampling is
case-insensitive.

Returns a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
that resolves to `true` if _user_ is allowed through the gate, `false` otherwise.

### CLI

To see the CLI tool's options, invoke `user-gate -h`. You can see help for the
tool's commands by passing `-h` to those too e.g. `user-gate encode -h`.

## Contributing

We welcome pull requests! Please lint your code.

### Running Tests

To run the Node tests: `npm test`.

To run the browser tests:

1. `npm run build-test` will build the tests and automatically rebuild them
if they/the code change.
2. `npm run open-test` will open and run the tests in the browser. Reload the
page to re-run the tests.

## Release History

* 1.0.2 Simplify usage by removing unnecessary warning from README (no code changes).
* 1.0.1 Smaller browser bundle.
* 1.0.0 Initial release.
