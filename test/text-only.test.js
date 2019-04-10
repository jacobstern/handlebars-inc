import Handlebars from 'handlebars';
import HandlebarsIDOM from '../lib';
import { readTestLocalFile, runInTestDOM } from './integration-test-framework';

test('renders a simple text template as a DOM fragment', () => {
  let hbs = readTestLocalFile('hbs/hello.hbs');
  let handlebarsTemplate = Handlebars.compile(hbs);
  let handlebarsText = handlebarsTemplate({ name: 'Jake' });
  let idomPrecompiled = HandlebarsIDOM.precompile(hbs, { idom: true });
  // console.debug(idomPrecompiled);
  let dom = runInTestDOM(`
    var mainDiv = document.getElementById('main');
    var template = HandlebarsIDOM.template(${idomPrecompiled});
    var thunk = template({ name: 'Jake' });
    IncrementalDOM.patch(mainDiv, thunk);
  `);
  let mainDiv = dom.window.document.getElementById('main');
  expect(mainDiv.innerHTML).toEqual(handlebarsText);
});
