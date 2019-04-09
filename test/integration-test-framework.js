import fs from 'fs';
import path from 'path';
import { Script } from 'vm';
import parse5 from 'parse5';
import { JSDOM } from 'jsdom';

let fileCache = {};

function createRuntimeScript() {
  let idomBuildPath = path.join(__dirname, '../dist/runtime.js');
  let source = fs.readFileSync(idomBuildPath, 'utf8');
  return new Script(source);
}

let runtimeScript = createRuntimeScript();

export function readTestLocalFile(relativePath) {
  let cached = fileCache[relativePath];
  if (!cached) {
    let filePath = path.join(__dirname, relativePath);
    cached = fileCache[relativePath] = fs.readFileSync(filePath, 'utf8');
  }
  return cached;
}

export function runInTestDOM(...sources) {
  const dom = new JSDOM(
    `
    <!DOCTYPE html>
    <html>
    
    <body>
        <div id="main"></div>
    </body>
    
    </html>
  `,
    { runScripts: 'outside-only' }
  );
  dom.runVMScript(runtimeScript);
  for (let source of sources) {
    dom.runVMScript(new Script(source));
  }
  return dom;
}

export function normalizeHTML(fragment) {
  return parse5.serialize(parse5.parseFragment(fragment));
}
