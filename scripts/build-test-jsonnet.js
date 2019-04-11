let fs = require('fs');
let path = require('path');
let util = require('util');
let { exec } = require('child_process');

let readdirAsync = util.promisify(fs.readdir);
let execAsync = util.promisify(exec);

async function main() {
  let testExamplesPath = path.join(__dirname, '../test/examples/');
  let files = await readdirAsync(testExamplesPath);
  let jsonnetFiles = files.filter(file => file.endsWith('.jsonnet'));
  for (let file of jsonnetFiles) {
    let fullPath = path.join(testExamplesPath, file);
    let jsonFile = file.substr(0, file.indexOf('.jsonnet')) + '.json';
    let out = path.join(testExamplesPath, jsonFile);
    await execAsync(`jsonnet -o ${out} ${fullPath}`);
  }
}

main();
