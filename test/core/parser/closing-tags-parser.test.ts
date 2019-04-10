import { parseClosingTags } from '../../../lib/core/parser/closing-tags-parser';

test('recognizes a closing tag and subsequent text', () => {
  let result = parseClosingTags('</div>Hello');
  expect(result.remaining).toBe('');
  expect(result.tags).toEqual([
    { type: 'closingTag', value: { tagName: 'div' } },
    { type: 'closingTagsInterstitialText', value: { text: 'Hello' } }
  ]);
});

test('recognizes multiple closing tags and stops at an opening tag', () => {
  let result = parseClosingTags('</div>Hello!\n</span><h2>');
  expect(result.remaining).toBe('<h2>');
  expect(result.tags).toEqual([
    { type: 'closingTag', value: { tagName: 'div' } },
    { type: 'closingTagsInterstitialText', value: { text: 'Hello!\n' } },
    { type: 'closingTag', value: { tagName: 'span' } }
  ]);
});

test('returns no result for empty string', () => {
  let result = parseClosingTags('');
  expect(result).toEqual({ tags: [], remaining: '' });
});

test('recognizes a closing h1 tag', () => {
  let result = parseClosingTags('</h1><div>');
  expect(result.remaining).toBe('<div>');
  expect(result.tags).toEqual([
    { type: 'closingTag', value: { tagName: 'h1' } }
  ]);
});

test('returns no result for a string beginning with opening tags', () => {
  let result = parseClosingTags('<div>Hello</div>');
  expect(result).toEqual({
    tags: [],
    remaining: '<div>Hello</div>'
  });
});
