let path = require('path');
let MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = env => {
  const isProd = env !== 'development';
  const plugins = [];
  if (isProd) {
    plugins.push(new MinifyPlugin(undefined, { include: /\.min\.js$/ }));
  }

  const runtimeEntry = path.resolve(__dirname, 'src/handlebars-inc-runtime.js');
  let entry;
  if (isProd) {
    entry = {
      'handlebars-inc-runtime.min': runtimeEntry,
      'handlebars-inc-runtime': runtimeEntry,
    };
  } else {
    entry = {
      'handlebars-inc-runtime.development': runtimeEntry,
    };
  }

  return {
    mode: isProd ? 'production' : 'development',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    },
    entry,
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
    plugins,
  };
};
