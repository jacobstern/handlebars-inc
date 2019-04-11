import { runIDOMToText } from '../../../lib/core/backend/idom-text-backend';
import { generateElementKey, normalizeHTML } from '../../test-helpers';

test('can render a basic HTML fragment', () => {
  let result = runIDOMToText(idom => {
    idom.elementOpen('div', generateElementKey(), [
      'class',
      'content',
      'id',
      'root'
    ]);
    idom.elementOpen('h1', generateElementKey(), []);
    idom.text('Hello World');
    idom.elementClose('h1');
    idom.text('Some content');
    idom.elementClose('div');
  });
  let expected = normalizeHTML(
    '<div class="content" id="root"><h1>Hello World</h1>Some content</div>'
  );
  expect(normalizeHTML(result)).toBe(expected);
});
