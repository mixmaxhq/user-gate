# user-gate

This project lets you define server-less feature gates without compromising
users' privacy. It comes in two parts:

* a Node module / CLI tool that let you encode a list of users
* a browser module that lets you check whether a user is on the list

Since the users are encoded (details [here](#user-encoding-scheme)), you can ship
the whole list to the client without exposing your users' information.

This is useful in scenarios where you can't or don't want to define server logic
to implement such a feature gate.

Additional features:

* You can check if the user is on the list from Node too (though this is primarily
for the benefit of the CLI tool)
* You can let a certain proportion i.e. 50% of users through the gate, independent
of the list, and deterministically (user X will always be allowed through the gate
even if they reload).
* v1.x and v2.x of this project offer two different [encoding schemes](#user-encoding-scheme)
with different performance tradeoffs.

## Installation

> We recommend installing the latest v2.x release. Some users will prefer v1.x's
tradeoffs, however. See comparison [here](#comparison-table).

For encoding the list:

```sh
# As part of some JS build process:
npm install user-gate --save-dev

# Using the CLI tool:
npm install user-gate -g
```

For checking the list:

```sh
# From both Node and the browser:
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

  // For v2.x.
  var numUsers = argv.numUsers;

  return gulp.src(argv.users)
    .pipe(JSONStream.parse('*'))
    .pipe(gateEncoder.toStream({ numUsers }))
    .pipe(rename('gate.json'))
    .pipe(publisher.publish());
})
```

Or you can encode the list using the CLI tool:

```sh
user-gate encode --list users.json --list-size 100 --sample 0.5 gate.json
```

### Checking the list

In the browser:

```html
<!-- Loads `UserGate` into `window`. There is also a minified version available, `dist/bundle.min.js`.
If anyone would like to produce a UMD version, a pull request would be very welcome! -->
<script src="node_modules/user-gate/dist/bundle.js"></script>

<script type="text/javascript">
  // Assuming that you have jQuery for the purposes of this example.
  $.getJSON('gate.json')
    .then(function(json) {
      var gate = new UserGate(json);

      var allowed = [
        gate.allows('jeff@mixmax.com'),
        gate.allows('walt@mixmax.com'),
        gate.allows('alice@mixmax.com')
      ];

      // v2.x
      // Logs "[true, false, true]":
      // - jeff@mixmax.com was on the list
      // - walt@mixmax.com was not on the list
      // - alice@mixmax.com was not on the list, but is in the first half of users.
      console.log(allowed);

      // In v1.x `UserGate#allows` returns a promise:
      Promise.all(allowed).then(function(allowedValues) {
        // Logs "[true, false, true]" as above.
        console.log(allowedValues);
      })
    });
</script>
```

You can also check the list from Node:

```js
var gate = new UserGate(JSON.parse(fs.readFileSync('gate.json', 'utf8')));

var allowed = gate.allows('jeff@mixmax.com');

// v2.x
console.log(allowed); // Logs "true"

// v1.x
allowed.then(function(allowedValue) {
  console.log(allowedValue); // Logs "true"
})
```

Or from the CLI tool:

```sh
# Prints 'Allowed'
user-gate check gate.json jeff@mixmax.com
```

**Note**: v2.x cannot decode gates produced by v1.x.

## Documentation

### UserGateEncoder

Available as `require('user-gate').encoder` in Node. Not available in the browser.

Serializes a user gate to a form that can be deserialized and read by
[`UserGate`](#usergate).

#### new UserGateEncoder(gate, options)

This is a constructor, and must be called with `new`.

_gate_:

* _list_: An array of strings identifying the users you wish to allow through
  the gate (emails, user IDs, whatever). You can also [stream these](#usergateencodertostreamoptions)
  into the encoder (in addition to users specified here, if you like).
  Defaults to `[]`.
* _sample_: The proportion of users to allow through the gate independent of the
  list, as a number between 0 and 1 e.g `0.5`. See [`UserGate#allows`](#usergateallowsuser)
  for more information on how this is interpreted. Defaults to `0`.

Passing a falsy or empty _gate_ will result in a gate that allows no users through.

_options_:

* _listFalsePositiveRate_ - (**v2.x only**) If _list_ is specified, this controls the rate at which
  users should be allowed through the gate even if they aren't on the list. `0.01` is the default
  (1 out of 100 users should be falsely allowed). Specifying a smaller rate will result in a larger
  encoded gate. 0 is unachievable.

#### UserGateEncoder#toJSON()

Returns the encoded gate as JSON.

The encoding format should be considered opaque. However, users (if any) will
be hashed ([details](#user-encoding-scheme)).

#### UserGateEncoder#toStream(options)

Returns a stream _to which_ you can write users, and _from which_ you can read
the JSON stringification of the encoded gate:

```js
var fs = require('fs');
var JSONStream = require('JSONStream');
var UserGateEncoder = require('user-gate').encoder;

fs.createReadStream('users.json')
  .pipe(JSONStream.parse('*'))
  .pipe(new UserGateEncoder().toStream({ numUsers: 100 /* v2.x */}))
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

**In v2.x**, pass `{ numUsers: 100 }` to indicate that you plan to write ~100
users to the stream. Passing a roughly-accurate estimate is crucial to enforcing
the desired false positive rate.

### UserGate

Available as `require('user-gate')` in Node, or as `window.UserGate` in the browser.

Deserializes a user gate and checks users against the gate.

#### new UserGate(encodedGate, options)

This is a constructor, and must be called with `new`.

_encodedGate_ is JSON produced by [`UserGateEncoder`](#usergateencoder).

_options_:

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

**In v2.x**, this returns `true` if _user_ is allowed through the gate, `false` otherwise.

**In v1.x**, this returns a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
that resolves to those Boolean values.

### CLI

To see the CLI tool's options, invoke `user-gate -h`. You can see help for the
tool's commands by passing `-h` to those too e.g. `user-gate encode -h`.

## User Encoding Scheme

v1.x and v2.x of this project offer two different schemes for encoding the list of
users (if one is provided). Skip to the [comparison table](#comparison-table)
if you like.

v1.x individually hashes each user using the SHA-256 algorithm. v1.x gates can
check if a user is on the list with 100% accuracy, at the cost of very large gates
(100.3kB gzipped to encode 3k email addresses).

For this reason, v2.x switches to encoding users using a [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), which produces drastically smaller gates (5.4kB gzipped to encode
3k email addresses) at the cost of a larger library size (9.2kB vs. 1kB, minified
and gzipped) and the possibility of false positives when checking the list.

What this means is that in v2.x [`UserGate#allows`](#usergateallowsuser) may
return `true` for a user that is not on the list. However, it will never return
`false` for a user that _is_ on the list. (False negatives are not possible.)

This ensures that everyone you wanted to have access to the feature does, and
a few others get a sneak peek. The authors of this library consider this to be
totally fine.

The false positive rate is tunable. Making the false positive rate smaller will
increase the size of the gate. A 0% rate is unachievable (the gate would be
infinitely large).

As a bonus, [`UserGate#allows`](#usergateallowsuser) became synchronous in v2.x.

v2.x cannot decode gates produced by v1.x.

### Comparison table

Property                                 | v1.x    | v2.x (recommended)
---------------------------------------- | ------- | ---
Gate size (3k email addresses, gzipped)  | 100.3kB | 5.4kB
Browser script size (minified & gzipped) | 1kB     | 9.2kB
Encoding time (3k users, 100 iterations) | 29 sec  | 25.1 sec
False positive rate                      | 0%      | &lt; 1%
Synchronous?                             | No      | Yes

### The Bloom Filter That v2.x Uses

There are many Bloom filter implementations in JavaScript, but none that seem to
be authoritative. This section documents why v2.x uses the one that it does.

A search for ["JavaScript bloom filter"](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=0ahUKEwjIhszb2czOAhVBLmMKHQY3AeoQFggeMAA&url=https%3A%2F%2Fwww.jasondavies.com%2Fbloomfilter%2F&usg=AFQjCNE7V5_Q_tKRY_kBbR7EIbZksmwbeA&sig2=EGuv2UAPoGm5hdAKNTwW0g)
returns (as of 8/18/2016) the [`bloomfilter`](https://github.com/jasondavies/bloomfilter.js)
library as the #1 result. However that library requires you manually specify the
number of bits to allocate, which is awkward. More problematic, the author says
that [the implementation may be flawed](https://github.com/jasondavies/bloomfilter.js/issues/15#issuecomment-123611448).

The #2 result, the [`bloom-filter`](https://github.com/bitpay/bloom-filter)
library, remedies these issues. If you tell it how many elements you want to store,
and the desired false positive rate, it figures out how much memory to allocate.
In addition, was developed by a company (Bitpay) to conform to a spec ([Bitcoin
connection filtering](https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki))
which gave us confidence in its reliability.

We use @semaj' fork, specifically its [`divergence` branch](https://github.com/bitpay/bloom-filter/compare/master...semaj:divergence),
because it seems to offer [better performance](https://github.com/bitpay/bloom-filter/pull/4) and even greater [correctness](https://github.com/bitpay/bloom-filter/commit/26fc59c6b8aeec715146314d2ccaee604d5e91b5), at the cost of a somewhat larger size
when built for the browser, due to its dependency on a `Buffer` polyfill.

The authors of this library are not cryptography experts. If you feel that this
choice is incorrect in some way, please [open an issue](https://github.com/mixmaxhq/user-gate/issues/new).

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

* 2.0.1 Support strict mode environments
* 2.0.0 Switch to encoding users using Bloom filters. [More details.](#user-encoding-scheme)
* 1.0.2 Simplify usage by removing unnecessary warning from README (no code changes).
* 1.0.1 Smaller browser bundle.
* 1.0.0 Initial release.
