import handlebars from '../../lib';
import { readExamplesFile } from '../test-helpers';

test('can add content to an app layout', async () => {
  let layout = await readExamplesFile('hbs/layout.hbs');
  let page = await readExamplesFile('hbs/page.hbs');
  let layoutTemplate = handlebars.compile(layout);
  let pageTemplate = handlebars.compile(page);
  let expected = await readExamplesFile('html/unescaped-body.html');
  let pageText = pageTemplate({ name: 'Jake' });
  let layoutText = layoutTemplate({
    body: pageText,
    title: 'My website',
    extraScripts: ['/js/search.js'],
  });
  expect(layoutText).toBe(expected);
});
