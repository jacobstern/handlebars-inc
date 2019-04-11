import chokidar from 'chokidar';
import {
  cleanJsonnetFileOutput,
  buildJsonnetFile,
  isJsonnetFile,
  allJsonnetFiles
} from '../scripts/support/test-jsonnet';

export default async function() {
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
