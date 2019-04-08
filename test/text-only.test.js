import handlebars from 'handlebars';
import parse5 from 'parse5';
import { getHbsSource, runInTestDOM } from './test-core';

test('renders a simple text template as a DOM fragment', () => {
  let hbs = getHbsSource('hello');
  let handlebarsTemplate = handlebars.compile(hbs);
  let handlebarsText = handlebarsTemplate({ name: 'Jake' });
  let handlebarsResult = parse5.parseFragment(handlebarsText);
  let dom = runInTestDOM(`
    let mainDiv = document.getElementById('main');
  
    let { text, patch } = IncrementalDOM;
    patch(mainDiv, function () {
      text('Hello Jake!');
    })
  `);
  let mainDiv = dom.window.document.getElementById('main');
  let domResult = parse5.parseFragment(mainDiv.innerHTML);
  expect(domResult).toEqual(handlebarsResult);
});
