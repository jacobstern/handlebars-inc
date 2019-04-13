import HandlebarsIdom from '../lib';
import { makeMockIdom } from './test-helpers';

test('accepts a custom incremental-dom implementation', () => {
  let mockIdom = makeMockIdom();
  let template = HandlebarsIdom.compile('<div>{{message}}</div>');
  HandlebarsIdom.idom = mockIdom;
  HandlebarsIdom.patch(
    null,
    template({ message: 'Hello world' }, { backend: 'idom', idom: mockIdom })
  );
  expect(mockIdom.elementOpen).toBeCalled();
});
