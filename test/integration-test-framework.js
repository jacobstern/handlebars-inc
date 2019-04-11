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

function getExpectedFromHandlebars(hbsContent, data, partials = {}) {
  if (partials != null) {
    for (let key in partials) {
      Handlebars.registerPartial(key, partials[key]);
    }
  }
  let handlebarsTemplate = Handlebars.compile(hbsContent);
  let template = handlebarsTemplate(data);
  if (partials != null) {
    for (let key in partials) {
      Handlebars.unregisterPartial(key);
    }
  }
  return template;
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
        testFn(example.desc, () => {
          let { template: hbs, expected, partials } = example;
          if (expected == null) {
            expected = getExpectedFromHandlebars(hbs, example.data, partials);
          }
          expected = normalizeHTML(expected);
          if (example.printExpected) {
            // eslint-disable-next-line no-console
            console.debug(`let expected = \`${expected}\`;`);
          }
          if (partials != null) {
            for (let key in partials) {
              HandlebarsIDOM.registerPartial(key, partials[key]);
            }
          }
          // console.log('Handlebars: ', Handlebars.precompile(hbs));
          // console.log('IDOM', HandlebarsIDOM.precompile(hbs));
          let template = HandlebarsIDOM.compile(hbs);
          let text = template(example.data);
          let normalizedText = normalizeHTML(text);
          expect(normalizedText).toBe(expected);
          let idomPrecompiled = HandlebarsIDOM.precompile(hbs);
          let scriptPartials = '{\n';
          if (partials != null) {
            for (let key in partials) {
              let precompiled = HandlebarsIDOM.precompile(partials[key]);
              scriptPartials += `${key}: HandlebarsIDOM.template(${precompiled}),\n`;
            }
          }
          scriptPartials += '\n}';
          let scriptData = JSON.stringify(example.data);
          let dom = runInTestDOM(`
              HandlebarsIDOM.partials = ${scriptPartials};
              var mainDiv = document.getElementById('main');
              var template = HandlebarsIDOM.template(${idomPrecompiled});
              var thunk = template(${scriptData}, { backend: 'idom' });
              HandlebarsIDOM.patch(mainDiv, thunk);
            `);
          let mainDiv = dom.window.document.getElementById('main');
          let normalizedIDOM = normalizeHTML(mainDiv.innerHTML);
          expect(normalizedIDOM).toBe(expected);
          for (let key in partials) {
            HandlebarsIDOM.unregisterPartial(key);
          }
        });
      });
    });
  });
}
