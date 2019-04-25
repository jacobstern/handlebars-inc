import { JSDOM } from 'jsdom';
import { runIdomToText } from '../../../lib/handlebars-inc/core/backend/idom-text-backend';
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
  // prettier-ignore
  let expected = '<div class="content" id="root"><h1>Hello World</h1>Some content</div>'
  expect(normalizeHTMLFragment(result)).toBe(expected);
});

test('can render a HTML fragment with partial tags', () => {
  let result = runIdomToText(idom => {
    idom.elementOpen('div', generateElementKey());
    idom.elementOpenStart('input', generateElementKey());
    idom.attr('value', 'China');
    idom.elementOpenEnd();
    idom.elementClose('input');
  });
  let expected = '<div><input value="China">';
  expect(result).toBe(expected);
});

test('renders partial tags for non-empty elements', () => {
  let result = runIdomToText(idom => {
    idom.elementOpen('div', generateElementKey());
    idom.elementOpenStart('div', generateElementKey());
    idom.attr('class', 'content');
    idom.elementOpenEnd();
    idom.text('Hello world!');
    idom.elementClose('div');
  });
  let expected = '<div><div class="content">Hello world!</div>';
  expect(result).toBe(expected);
});

test('returns null for currentPointer()', () => {
  runIdomToText(idom => {
    expect(idom.currentPointer()).toBeNull();
  });
  expect.assertions(1);
});

test('throws if patch() is called', () => {
  runIdomToText(idom => {
    expect(() => {
      idom.patch(new JSDOM().window.document.createElement('div'), () => {});
    }).toThrowError('Patch not implemented for IDOM text backend');
  });
  expect.assertions(1);
});
