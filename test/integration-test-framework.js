import fs from 'fs';
import path from 'path';
import { Script } from 'vm';
import parse5 from 'parse5';
import Handlebars from 'handlebars';
import HandlebarsIDOM from '../lib';
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

export function runIntegrationTests(configs) {
  configs.forEach(config => {
    describe(config.desc, () => {
      config.examples.forEach(example => {
        let testFn = test;
        if (example.skip) {
          testFn = test.skip;
        } else if (example.only) {
          testFn = test.only;
        }
        testFn(example.desc, done => {
          let filePath = path.join(__dirname, 'examples', 'hbs', example.file);
          fs.readFile(filePath, { encoding: 'utf8' }, (err, hbsContent) => {
            if (err) {
              throw err;
            }
            let handlebarsTemplate = Handlebars.compile(hbsContent);
            let handlebarsText = handlebarsTemplate(example.data);
            let handlebarsResult = normalizeHTML(handlebarsText);
            let bundledHandlebarsTemplate = HandlebarsIDOM.compile(hbsContent);
            let bundledHandlebarsText = bundledHandlebarsTemplate(example.data);
            expect(bundledHandlebarsText).toBe(handlebarsText);
            let idomPrecompiled = HandlebarsIDOM.precompile(hbsContent, {
              idom: true
            });
            let dom = runInTestDOM(`
              var mainDiv = document.getElementById('main');
              var template = HandlebarsIDOM.template(${idomPrecompiled});
              var thunk = template(${JSON.stringify(example.data)});
              IncrementalDOM.patch(mainDiv, thunk);
            `);
            let mainDiv = dom.window.document.getElementById('main');
            let domResult = normalizeHTML(mainDiv.innerHTML);
            expect(domResult).toEqual(handlebarsResult);
            done();
          });
        });
      });
    });
  });
}
