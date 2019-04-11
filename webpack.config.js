let path = require('path');
let MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'runtime.js',
  },
  entry: path.resolve(__dirname, 'src/runtime.js'),
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          envName: 'runtime',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  optimization: {
    minimize: false,
  },
  plugins: [new MinifyPlugin()],
};
