import fs from 'fs';
import path from 'path';
import { Script } from 'vm';
import { JSDOM } from 'jsdom';

let hbsCache = {};

function createRuntimeScript() {
  let idomBuildPath = path.join(__dirname, '../dist/runtime.js');
  let source = fs.readFileSync(idomBuildPath, 'utf8');
  return new Script(source);
}

let runtimeScript = createRuntimeScript();

export function getHbsSource(name) {
  let cached = hbsCache[name];
  if (!cached) {
    let filePath = path.join(__dirname, 'hbs', name + '.hbs');
    cached = hbsCache[name] = fs.readFileSync(filePath, 'utf8');
  }
  return cached;
}

export function runInTestDOM(scriptSrc) {
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
  dom.runVMScript(new Script(scriptSrc));
  return dom;
}
