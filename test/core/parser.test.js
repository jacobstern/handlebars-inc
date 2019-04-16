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

test('generates the correct operations for self closing tags', () => {
  let result = parseFragment('<div><input type="text"></div>');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [],
        tagName: 'div',
      },
    },
    {
      type: 'emptyElement',
      value: {
        propertyValuePairs: [['type', 'text']],
        tagName: 'input',
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

test('handles XML-style self closing tag', () => {
  let result = parseFragment('<div><input type="text"/></div>');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: {
        propertyValuePairs: [],
        tagName: 'div',
      },
    },
    {
      type: 'emptyElement',
      value: {
        propertyValuePairs: [['type', 'text']],
        tagName: 'input',
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

test('parses an open partial tag at the end of a fragment', () => {
  let result = parseFragment('<div><input type="');
  expect(result.type).toBe('openPartialTag');
  expect(result.value).toEqual({
    leadingOperations: [
      {
        type: 'elementOpen',
        value: {
          tagName: 'div',
          propertyValuePairs: [],
        },
      },
    ],
    tagName: 'input',
    content: ' type="',
  });
});

test('parses an open partial tag after an unmatched closing tag', () => {
  let result = parseFragment('Text</span><div><input type="');
  expect(result.type).toBe('openPartialTag');
  expect(result.value).toEqual({
    leadingOperations: [
      {
        type: 'text',
        value: {
          text: 'Text',
        },
      },
      {
        type: 'elementClose',
        value: {
          tagName: 'span',
        },
      },
      {
        type: 'elementOpen',
        value: {
          tagName: 'div',
          propertyValuePairs: [],
        },
      },
    ],
    tagName: 'input',
    content: ' type="',
  });
});

test('parses the beginning of a single tag', () => {
  let result = parseFragment('<button class="');
  expect(result.type).toBe('openPartialTag');
  expect(result.value).toEqual({
    leadingOperations: [],
    tagName: 'button',
    content: ' class="',
  });
});

test('parses a closing tag in between two valid fragments', () => {
  // prettier-ignore
  let result = parseFragment('<div>Hello world!</div></form><input type="text">');
  expect(result.type).toBe('fullTags');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: {
        tagName: 'div',
        propertyValuePairs: [],
      },
    },
    {
      type: 'text',
      value: {
        text: 'Hello world!',
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
        tagName: 'form',
      },
    },
    {
      type: 'emptyElement',
      value: {
        tagName: 'input',
        propertyValuePairs: [['type', 'text']],
      },
    },
  ]);
});
