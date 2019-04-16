let path = require('path');
let MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = env => {
  let isProd = env !== 'development';
  let plugins = [];
  if (isProd) {
    plugins.push(new MinifyPlugin());
  }
  return {
    mode: isProd ? 'production' : 'development',
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
      minimize: isProd,
    },
    plugins,
  };
};
