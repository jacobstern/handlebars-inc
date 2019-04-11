var path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'runtime.js'
  },
  entry: './src/runtime.js',
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          envName: 'runtime'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
