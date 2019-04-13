import runtime from '../lib/index.runtime';
import HandlebarsIDOM from '../lib';
import { makeMockIncrementalDOM } from './test-helpers';

test('throws on the property getter for incremental-dom in a Node environment', () => {
  expect(() => {
    runtime.IncrementalDOM;
  }).toThrowError(/HandlebarsIDOM.IncrementalDOM was not loaded/);
});

test('accepts a custom incremental-dom implementation', () => {
  let mockIncrementalDOM = makeMockIncrementalDOM();
  runtime.IncrementalDOM = mockIncrementalDOM;
  let template = HandlebarsIDOM.compile('<div>{{message}}</div>');
  HandlebarsIDOM.patch(
    null,
    template({ message: 'Hello world' }, { backend: 'idom' })
  );
  expect(mockIncrementalDOM.elementOpen).toBeCalled();
});

afterEach(() => {
  runtime.IncrementalDOM = null;
});
