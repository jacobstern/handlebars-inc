import util from 'util';
import path from 'path';
import fs from 'fs';
import handlebars from '../../lib';
import { makeMockIdom } from '../test-helpers';

let readFileAsync = util.promisify(fs.readFile);

async function readExamplesFile(file) {
  let hbsDir = path.resolve(__dirname, '../examples/');
  return await readFileAsync(path.join(hbsDir, file), 'utf8');
}

test.skip('can add content to an app layout', async () => {
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

test('trying to render a page layout throws at runtime', async () => {
  let layout = await readExamplesFile('hbs/layout.hbs');
  let layoutTemplate = handlebars.compile(layout);
  let page = await readExamplesFile('hbs/page.hbs');
  let pageTemplate = handlebars.compile(page);
  let pageText = pageTemplate({ name: 'Jake' });
  let mockIdom = makeMockIdom();
  let templateOptions = { backend: 'idom', idom: mockIdom };
  expect(() => {
    mockIdom.patch(
      null,
      layoutTemplate({ body: pageText, title: 'My website' }, templateOptions)
    );
  }).toThrowError('invalid HTML fragment');
  mockIdom.patch(null, pageTemplate({ name: 'Jake' }, templateOptions));
  expect(mockIdom.elementOpen).toBeCalledTimes(1);
  expect(mockIdom.text).toBeCalled();
  expect(mockIdom.elementClose).toBeCalledTimes(1);
});
