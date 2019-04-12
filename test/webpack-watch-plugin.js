let fs = require('fs');
let path = require('path');
let webpack = require('webpack');
let webpackConfig = require('../webpack.config');
let util = require('util');

function walkSync(dir, accum = []) {
  let files = fs.readdirSync(dir);
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      accum = walkSync(path.join(dir, file), accum);
    } else {
      accum.push(path.resolve(dir, file));
    }
  });
  return accum;
}

let webpackAsync = util.promisify(webpack);

module.exports = class WebpackWatchPlugin {
  constructor() {
    this.lastUpdate = Date.now();
  }

  apply(jestHooks) {
    jestHooks.onFileChange(async args => {
      let allTestPaths = [];
      args.projects.forEach(project => {
        allTestPaths = allTestPaths.concat(project.testPaths);
      });
      let libDir = path.resolve(__dirname, '../lib');
      let sourceFiles = walkSync(libDir);
      let shouldUpdate = false;
      sourceFiles.forEach(file => {
        if (file.indexOf('vendor') < 0) {
          let updated = fs.statSync(file).mtimeMs;
          if (updated > this.lastUpdate) {
            shouldUpdate = true;
          }
        }
      });
      if (shouldUpdate) {
        await webpackAsync(webpackConfig);
        this.lastUpdate = new Date();
      }
    });
  }
};
