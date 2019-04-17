import HandlebarsInc from '../lib';
import { makeMockIdom, readExamplesFile } from './test-helpers';

test('can generate a key from static source', async () => {
  const hbs = await readExamplesFile('hbs/static-key.hbs');
  const template = HandlebarsInc.compile(hbs);
  const mockIdom = makeMockIdom();
  mockIdom.patch(null, template({}, { backend: 'idom', idom: mockIdom }));
  expect(mockIdom.elementOpen).toBeCalledWith('div', 'my-idom-key', [
    'data-idom-key',
    'my-idom-key',
  ]);
});

test('can generate a key based on the data-idom-key attribute at runtime', async () => {
  const hbs = await readExamplesFile('hbs/dynamic-key.hbs');
  const template = HandlebarsInc.compile(hbs);
  const mockIdom = makeMockIdom();
  mockIdom.patch(
    null,
    template(
      { id: 1, content: 'Hello world!' },
      { backend: 'idom', idom: mockIdom }
    )
  );
  expect(mockIdom.elementOpen).toBeCalledWith(
    'li',
    '1',
    undefined,
    'data-idom-key',
    '1'
  );
});
