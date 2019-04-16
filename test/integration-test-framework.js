import fs from 'fs';
import path from 'path';
import { Script } from 'vm';
import Handlebars from 'handlebars';
import HandlebarsIdom from '../lib';
import { JSDOM } from 'jsdom';
import { normalizeHTMLFragment } from './test-helpers';

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
          let {
            template: hbs,
            expected,
            partials,
            backends = ['text', 'idom'],
          } = example;
          if (expected == null) {
            expected = getExpectedFromHandlebars(hbs, example.data, partials);
          }
          expected = normalizeHTMLFragment(expected);
          if (example.debugPrintExpected === true) {
            // eslint-disable-next-line no-console
            console.debug(`let expected = \`${expected}\`;`);
          }
          if (partials != null) {
            for (let key in partials) {
              HandlebarsIdom.registerPartial(key, partials[key]);
            }
          }

          if (backends.indexOf('text') >= 0) {
            let template = HandlebarsIdom.compile(hbs);
            let text = template(example.data);
            let normalizedText = normalizeHTMLFragment(text);
            expect(normalizedText).toBe(expected);
          }

          if (backends.indexOf('idom') >= 0) {
            let idomPrecompiled = HandlebarsIdom.precompile(hbs);
            let scriptPartials = '{\n';
            if (partials != null) {
              for (let key in partials) {
                let precompiled = HandlebarsIdom.precompile(partials[key]);
                scriptPartials += `${key}: HandlebarsIdom.template(${precompiled}),\n`;
              }
            }
            scriptPartials += '\n}';
            let scriptData = JSON.stringify(example.data);
            let dom = runInTestDOM(`
                HandlebarsIdom.partials = ${scriptPartials};
                var mainDiv = document.getElementById('main');
                var template = HandlebarsIdom.template(${idomPrecompiled});
                var thunk = template(${scriptData}, { backend: 'idom' });
                HandlebarsIdom.patch(mainDiv, thunk);
              `);
            let mainDiv = dom.window.document.getElementById('main');
            let normalizedIdom = normalizeHTMLFragment(mainDiv.innerHTML);
            expect(normalizedIdom).toBe(expected);
          }

          for (let key in partials) {
            HandlebarsIdom.unregisterPartial(key);
          }
        });
      });
    });
  });
}
