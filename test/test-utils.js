import fs from 'fs';
import util from 'util';
import path from 'path';

async function readFileText(path) {
  return await util.promisify(fs.readFile)(path, 'utf8');
}

export async function readFileRelative(relativePath) {
  return await readFileText(path.join(__dirname, relativePath));
}
