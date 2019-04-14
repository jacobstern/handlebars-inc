import { parseFragment } from '../../lib/core/parser';

test('returns empty for empty string', () => {
  const result = parseFragment('');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toHaveLength(0);
});

test('parses a text node', () => {
  const result = parseFragment('Hello ');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toHaveLength(1);
  const text = result.value.operations[0];
  expect(text).toEqual({ type: 'text', value: { text: 'Hello ' } });
});

test('parses an element with contents and attributes', () => {
  let result = parseFragment('<div class="foo">Test</div>');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: { tagName: 'div', propertyValuePairs: [['class', 'foo']] },
    },
    {
      type: 'text',
      value: { text: 'Test' },
    },
    {
      type: 'elementClose',
      value: { tagName: 'div' },
    },
  ]);
});

test('parses a fragment with an unclosed tag', () => {
  let result = parseFragment('<div class="foo">Te');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: { tagName: 'div', propertyValuePairs: [['class', 'foo']] },
    },
    {
      type: 'text',
      value: { text: 'Te' },
    },
  ]);
});

test('parses a fragment with unmatched closing tags', () => {
  let result = parseFragment('</h1><p>Test</p></span>');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementClose',
      value: { tagName: 'h1' },
    },
    {
      type: 'elementOpen',
      value: { tagName: 'p', propertyValuePairs: [] },
    },
    {
      type: 'text',
      value: { text: 'Test' },
    },
    {
      type: 'elementClose',
      value: { tagName: 'p' },
    },
    {
      type: 'elementClose',
      value: { tagName: 'span' },
    },
  ]);
});

test('parses a fragment with unmatched closing tags with text in between', () => {
  let result = parseFragment('</h1><p>Test</p>Bar</span>Foo');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementClose',
      value: { tagName: 'h1' },
    },
    {
      type: 'elementOpen',
      value: { tagName: 'p', propertyValuePairs: [] },
    },
    {
      type: 'text',
      value: { text: 'Test' },
    },
    {
      type: 'elementClose',
      value: { tagName: 'p' },
    },
    {
      type: 'text',
      value: { text: 'Bar' },
    },
    {
      type: 'elementClose',
      value: { tagName: 'span' },
    },
    {
      type: 'text',
      value: { text: 'Foo' },
    },
  ]);
});

test('parses a fragment with nested tags', () => {
  // prettier-ignore
  let result = parseFragment('<div class="foo"><h1>Hello</h1><div class="content"><strong>Test</strong></div></div>');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [['class', 'foo']],
        tagName: 'div',
      },
    },
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [],
        tagName: 'h1',
      },
    },
    {
      type: 'text',
      value: {
        text: 'Hello',
      },
    },
    {
      type: 'elementClose',
      value: {
        tagName: 'h1',
      },
    },
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [['class', 'content']],
        tagName: 'div',
      },
    },
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [],
        tagName: 'strong',
      },
    },
    {
      type: 'text',
      value: {
        text: 'Test',
      },
    },
    {
      type: 'elementClose',
      value: {
        tagName: 'strong',
      },
    },
    {
      type: 'elementClose',
      value: {
        tagName: 'div',
      },
    },
    {
      type: 'elementClose',
      value: {
        tagName: 'div',
      },
    },
  ]);
});

test('parses a partial fragment with nested tags', () => {
  // prettier-ignore
  let result = parseFragment('<div class="foo"><h1>Hello</h1><div class="content">');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [['class', 'foo']],
        tagName: 'div',
      },
    },
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [],
        tagName: 'h1',
      },
    },
    {
      type: 'text',
      value: {
        text: 'Hello',
      },
    },
    {
      type: 'elementClose',
      value: {
        tagName: 'h1',
      },
    },
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [['class', 'content']],
        tagName: 'div',
      },
    },
  ]);
});
