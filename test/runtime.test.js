import HandlebarsInc from '../lib';
import { makeMockIdom } from './test-helpers';

test('accepts a custom incremental-dom implementation', () => {
  let mockIdom = makeMockIdom();
  let template = HandlebarsInc.compile('<div>{{message}}</div>');
  HandlebarsInc.idom = mockIdom;
  HandlebarsInc.patch(
    null,
    template({ message: 'Hello world' }, { backend: 'idom', idom: mockIdom })
  );
  expect(mockIdom.elementOpen).toBeCalled();
});
