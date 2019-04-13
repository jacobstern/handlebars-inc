import { runIdomToText } from '../../../lib/core/backend/idom-text-backend';
import { generateElementKey, normalizeHTMLFragment } from '../../test-helpers';

test('can render a basic HTML fragment', () => {
  let result = runIdomToText(idom => {
    idom.elementOpen('div', generateElementKey(), [
      'class',
      'content',
      'id',
      'root',
    ]);
    idom.elementOpen('h1', generateElementKey(), []);
    idom.text('Hello World');
    idom.elementClose('h1');
    idom.text('Some content');
    idom.elementClose('div');
  });
  let expected = normalizeHTMLFragment(
    '<div class="content" id="root"><h1>Hello World</h1>Some content</div>'
  );
  expect(normalizeHTMLFragment(result)).toBe(expected);
});
