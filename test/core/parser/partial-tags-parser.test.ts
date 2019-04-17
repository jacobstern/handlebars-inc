import {
  parseOpenPartialTag,
  parsePartialTagEnd,
} from '../../../lib/handlebars-inc/core/parser/partial-tags-parser';

test('returns a negative result for open partial tag in a plain string', () => {
  let result = parseOpenPartialTag('Hello world');
  expect(result).toBe(undefined);
});

test('parses an open partial tag with attributes', () => {
  let result = parseOpenPartialTag('<button class="button ');
  expect(result).toEqual({ tagName: 'button', content: ' class="button ' });
});

test('returns a negative result for end partial tag in attrs text', () => {
  let result = parseOpenPartialTag('" name="submit" type="');
  expect(result).toBe(undefined);
});

test('parses the end of a partial tag with content', () => {
  let result = parsePartialTagEnd(' id="submit-button">Some content');
  expect(result).toEqual({
    content: ' id="submit-button"',
    remaining: 'Some content',
  });
});
