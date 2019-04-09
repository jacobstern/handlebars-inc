import Handlebars from 'handlebars';
import HandlebarsIDOM from '../lib';
import {
  readTestLocalFile,
  normalizeHTML,
  runInTestDOM
} from './integration-test-framework';

test('renders a simple text template as a DOM fragment', () => {
  let hbs = readTestLocalFile('hbs/hello.hbs');
  let handlebarsTemplate = Handlebars.compile(hbs);
  let handlebarsText = handlebarsTemplate({ name: 'Jake' });
  let handlebarsResult = normalizeHTML(handlebarsText);
  let idomPrecompiled = HandlebarsIDOM.precompile(hbs, { idom: true });
  console.debug(idomPrecompiled);
  let dom = runInTestDOM(`
    var mainDiv = document.getElementById('main');
    var template = HandlebarsIDOM.template(${idomPrecompiled});
    var thunk = template({ name: 'Jake' });
    IncrementalDOM.patch(mainDiv, thunk);
  `);
  let mainDiv = dom.window.document.getElementById('main');
  let domResult = normalizeHTML(mainDiv.innerHTML);
  expect(domResult).toEqual(handlebarsResult);
});
