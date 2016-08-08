/* jshint node:true, esnext:true */
var webpack = require('webpack');

module.exports = {
  externals: {
    // Prevent Webpack from shimming Node's crypto module--`require('crypto')` is actually dead code
    // when this module is loaded in the browser, and we use the browser's crypto module.
    'crypto': 'crypto'
  }
};

if (process.env.NODE_ENV === 'test') {
  Object.assign(module.exports, {
    entry: './spec/gate/indexSpec.js',
    output: {
      filename: './spec/gate/spec.bundle.js'
    }
  });
} else {
  module.exports.entry = './src/gate/exports.js';

  if (process.env.NODE_ENV === 'production') {
    Object.assign(module.exports, {
      devtool: 'source-map',
      output: {
        filename: './dist/bundle.min.js'
      },
      plugins: [
        new webpack.optimize.UglifyJsPlugin({
          compress: { warnings: false }
        }),
        new webpack.optimize.OccurrenceOrderPlugin(true)
      ]
    });
  } else {
    Object.assign(module.exports, {
      output: {
        filename: './dist/bundle.js'
      }
    });
  }
}
