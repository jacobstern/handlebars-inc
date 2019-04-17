import { parseAttributes } from '../../lib/handlebars-inc/core/attributes-parser';

test('parses a potentially ambiguous double quoted attribute', () => {
  const result = parseAttributes(' data-info=" nesting=\'single quotes\'"');
  expect(result).toEqual([['data-info', " nesting='single quotes'"]]);
});

test('parses a potentially ambiguous single quoted attribute', () => {
  const result = parseAttributes(' data-info=\' nesting="double quotes"\'');
  expect(result).toEqual([['data-info', ' nesting="double quotes"']]);
});

test('parses an attribute with space-separated values', () => {
  const result = parseAttributes(' baz=" foo bar " ');
  expect(result).toEqual([['baz', ' foo bar ']]);
});

test('parses an attribute with non-quoted attributes', () => {
  const result = parseAttributes(' foo bar=baz qux');
  expect(result).toEqual([['foo', ''], ['bar', 'baz'], ['qux', '']]);
});
