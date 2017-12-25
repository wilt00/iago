'use strict';

const path = require('path');
const webpack = require('webpack');

const entryPoint = './src/index.js';
const outputPath = path.resolve(__dirname, './dist');
const fileName = 'index.js';

const plugins = [];

// Get the environment variable defined in the command (see package.json)
const env = process.env.WEBPACK_ENV;

// When compiling for production we want the app to be uglified.
/* if (env === 'production') {
  let UglifyPlugin = webpack.optimize.UglifyJsPlugin;

  plugins.push(new UglifyPlugin({
    minimize: true
  }));

  // We also add it as a global, the Vue lib needs it to determine if Dev tool 
  // should be active or not.
  plugins.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: '"production"'
    }
  }));
  // Change file name extension to min.js
  fileName = fileName.replace(/js/g, 'min.js');
} */

// Main webpack config
module.exports = {
  entry: {
    app: [entryPoint],
  },
  output: {
    path: outputPath,
    filename: fileName,
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015'], // Transpile the ES6 to es2015 standard
      },
    },
    {
      test: /\.vue$/,
      loader: 'vue-loader',
    },
    ],
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js', // Resolving the vue var for standalone build
    },
  },
  plugins, // set the previously defined plugins
};
