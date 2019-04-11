import fs from 'fs';
import path from 'path';
import { Script } from 'vm';
import Handlebars from 'handlebars';
import HandlebarsIDOM from '../lib';
import { JSDOM } from 'jsdom';
import { normalizeHTML } from './test-helpers';

function createRuntimeScript() {
  let idomBuildPath = path.join(__dirname, '../dist/runtime.js');
  let source = fs.readFileSync(idomBuildPath, 'utf8');
  return new Script(source);
}

let runtimeScript = createRuntimeScript();

function runInTestDOM(...sources) {
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

function getExpectedFromHandlebars(hbsContent, data) {
  let handlebarsTemplate = Handlebars.compile(hbsContent);
  return handlebarsTemplate(data);
}

export function runIntegrationTests(configs) {
  configs.forEach(config => {
    describe(config.desc, () => {
      config.examples.forEach(example => {
        let testFn = test;
        if (example.test === 'skip') {
          testFn = test.skip;
        } else if (example.test === 'only') {
          testFn = test.only;
        }
        testFn(example.desc, done => {
          let filePath = path.join(__dirname, 'examples', 'hbs', example.file);
          fs.readFile(filePath, { encoding: 'utf8' }, (err, hbsContent) => {
            if (err) {
              throw err;
            }
            let expected = example.expected;
            if (expected == null) {
              expected = getExpectedFromHandlebars(hbsContent, example.data);
            }
            expected = normalizeHTML(expected);
            let template = HandlebarsIDOM.compile(hbsContent);
            let text = template(example.data);
            let normalizedText = normalizeHTML(text);
            expect(normalizedText).toBe(expected);
            let idomPrecompiled = HandlebarsIDOM.precompile(hbsContent);
            // console.log('Handlebars: ', Handlebars.precompile(hbsContent));
            // console.log('IDOM', idomPrecompiled);
            let dom = runInTestDOM(`
              var mainDiv = document.getElementById('main');
              var template = HandlebarsIDOM.templateIDOM(${idomPrecompiled});
              var thunk = template(${JSON.stringify(example.data)});
              HandlebarsIDOM.patch(mainDiv, thunk);
            `);
            let mainDiv = dom.window.document.getElementById('main');
            let normalizedIDOM = normalizeHTML(mainDiv.innerHTML);
            expect(normalizedIDOM).toEqual(expected);
            done();
          });
        });
      });
    });
  });
}
