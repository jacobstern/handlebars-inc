import { parse } from '../../../lib/core/parser/closing-tags-parser';

test('recognizes a closing tag and subsequent text', () => {
  let result = parse('</div>Hello');
  expect(result.remaining).toBe('');
  expect(result.tags).toEqual([
    { type: 'closingTag', value: { tagName: 'div' } },
    { type: 'closingTagsInterstitialText', value: { text: 'Hello' } }
  ]);
});

test('recognizes multiple closing tags and stops at an opening tag', () => {
  let result = parse('</div>Hello!\n</span><h2>');
  expect(result.remaining).toBe('<h2>');
  expect(result.tags).toEqual([
    { type: 'closingTag', value: { tagName: 'div' } },
    { type: 'closingTagsInterstitialText', value: { text: 'Hello!\n' } },
    { type: 'closingTag', value: { tagName: 'span' } }
  ]);
});

test('returns no result for empty string', () => {
  let result = parse('');
  expect(result).toEqual({ tags: [], remaining: '' });
});

test('returns no result for a string beginning with opening tags', () => {
  let result = parse('<div>Hello</div>');
  expect(result).toEqual({
    tags: [],
    remaining: '<div>Hello</div>'
  });
});
