import { parseFragment } from '../lib/core/parser';

test('returns empty for empty string', () => {
  const result = parseFragment('');
  expect(result.type).toBe('fully-parsed');
  expect(result.value.operations).toHaveLength(0);
});

test('parses a text node', () => {
  const result = parseFragment('Hello ');
  expect(result.type).toBe('fully-parsed');
  expect(result.value.operations).toHaveLength(1);
  const text = result.value.operations[0];
  expect(text.type).toBe('text');
  expect(text.value.text).toBe('Hello ');
});
