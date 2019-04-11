let fs = require('fs');
let path = require('path');
let util = require('util');
let { exec } = require('child_process');

let readdirAsync = util.promisify(fs.readdir);
let execAsync = util.promisify(exec);
let rmAsync = util.promisify(fs.unlink);
let testExamplesPath = path.join(__dirname, '../../test/examples/');

function isJsonnetFile(filePath) {
  return filePath.endsWith('.jsonnet');
}

async function allJsonnetFiles() {
  let files = await readdirAsync(testExamplesPath);
  return files
    .filter(file => file.endsWith('.jsonnet'))
    .map(file => path.join(testExamplesPath, file));
}

async function buildJsonnetFile(filePath) {
  if (isJsonnetFile(filePath)) {
    let jsonFileName = path.basename(filePath, '.jsonnet') + '.json';
    let out = path.join(path.dirname(filePath), jsonFileName);
    await execAsync(`jsonnet -o ${out} ${filePath}`);
  }
}

async function buildTestJsonnet() {
  let jsonnetFiles = await allJsonnetFiles();
  for (let file of jsonnetFiles) {
    await buildJsonnetFile(file);
  }
}

async function cleanJsonnetFileOutput(filePath) {
  let jsonFileName = path.basename(filePath, '.jsonnet') + '.json';
  let out = path.join(path.dirname(filePath), jsonFileName);
  await rmAsync(out);
}

async function cleanTestJsonnet() {
  let files = await readdirAsync(testExamplesPath);
  let outputFiles = files.filter(file => file.endsWith('.json'));
  for (let file of outputFiles) {
    let fullPath = path.join(testExamplesPath, file);
    await rmAsync(fullPath);
  }
}

module.exports = {
  isJsonnetFile,
  buildJsonnetFile,
  buildTestJsonnet,
  cleanJsonnetFileOutput,
  cleanTestJsonnet,
  allJsonnetFiles
};
