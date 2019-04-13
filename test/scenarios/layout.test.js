import util from 'util';
import path from 'path';
import fs from 'fs';
import handlebars from '../../lib';
import { makeMockIncrementalDOM } from '../test-helpers';

let readFileAsync = util.promisify(fs.readFile);

async function readExamplesFile(file) {
  let hbsDir = path.resolve(__dirname, '../examples/');
  return await readFileAsync(path.join(hbsDir, file), 'utf8');
}

test('can add content to an app layout', async () => {
  let layout = await readExamplesFile('hbs/layout.hbs');
  let page = await readExamplesFile('hbs/page.hbs');
  let layoutTemplate = handlebars.compile(layout);
  let pageTemplate = handlebars.compile(page);
  let expected = await readExamplesFile('html/unescaped-body.html');
  let pageText = pageTemplate({ name: 'Jake' });
  let layoutText = layoutTemplate({ body: pageText, title: 'My website' });
  expect(layoutText).toBe(expected);
});

test('trying to render a page layout throws at runtime', async () => {
  let layout = await readExamplesFile('hbs/layout.hbs');
  let layoutTemplate = handlebars.compile(layout);
  let page = await readExamplesFile('hbs/page.hbs');
  let pageTemplate = handlebars.compile(page);
  let pageText = pageTemplate({ name: 'Jake' });
  let idom = makeMockIncrementalDOM();
  expect(() => {
    idom.patch(
      null,
      layoutTemplate(
        { body: pageText, title: 'My website' },
        { backend: 'idom', IncrementalDOM: idom }
      )
    );
  }).toThrowError('invalid HTML fragment');
  idom.patch(
    null,
    pageTemplate({ name: 'Jake' }, { backend: 'idom', IncrementalDOM: idom })
  );
  expect(idom.elementOpen).toBeCalledTimes(1);
  expect(idom.text).toBeCalled();
  expect(idom.elementClose).toBeCalledTimes(1);
});
