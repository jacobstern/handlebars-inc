import chokidar from 'chokidar';
import util from 'util';
let { exec } = require('child_process');

let execAsync = util.promisify(exec);

import {
  buildTestJsonnet,
  cleanTestJsonnet,
  cleanJsonnetFileOutput,
  buildJsonnetFile,
  isJsonnetFile,
  allJsonnetFiles
} from '../scripts/support/test-jsonnet';

async function initTestJsonnet() {
  await cleanTestJsonnet();
  await buildTestJsonnet();
}

async function buildWebpack() {
  await execAsync('webpack --mode=development');
}

export default async function() {
  await Promise.all([buildWebpack(), initTestJsonnet()]);
  let jsonnetFiles = await allJsonnetFiles();
  let watcher = chokidar.watch(jsonnetFiles);
  watcher.on('change', file => {
    try {
      buildJsonnetFile(file);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  });
  watcher.on('add', file => {
    if (isJsonnetFile(file)) {
      try {
        buildJsonnetFile(file);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
      watcher.add(file);
    }
  });
  watcher.on('unlink', file => {
    cleanJsonnetFileOutput(file);
  });
  global.jsonnetWatcher = watcher;
}
