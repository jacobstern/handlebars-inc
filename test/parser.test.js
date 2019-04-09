import { parseFragment } from '../lib/core/parser';

test('returns empty for empty string', () => {
  const result = parseFragment('');
  expect(result.type).toBe('fullyParsed');
  expect(result.value.operations).toHaveLength(0);
});

test('parses a text node', () => {
  const result = parseFragment('Hello ');
  expect(result.type).toBe('fullyParsed');
  expect(result.value.operations).toHaveLength(1);
  const text = result.value.operations[0];
  expect(text.type).toBe('text');
  expect(text.value.text).toBe('Hello ');
});

test('parses an element with contents and attributes', () => {
  let result = parseFragment('<div class="foo">Test</div>');
  expect(result.type).toBe('fullyParsed');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: { tagName: 'div', propertyValuePairs: [['class', 'foo']] }
    },
    {
      type: 'text',
      value: { text: 'Test' }
    },
    {
      type: 'elementClose',
      value: { tagName: 'div' }
    }
  ]);
});

test('parses a fragment with an unclosed tag', () => {
  let result = parseFragment('<div class="foo">Te');
  expect(result.type).toBe('fullyParsed');
  expect(result.value.operations).toEqual([
    {
      type: 'elementOpen',
      value: { tagName: 'div', propertyValuePairs: [['class', 'foo']] }
    },
    {
      type: 'text',
      value: { text: 'Te' }
    }
  ]);
});

test('parses a fragment with nested tags', () => {
  // prettier-ignore
  let result = parseFragment('<div class="foo"><h1>Hello</h1><div class="content"><strong>Test</strong></div></div>');
  expect(result.type).toBe('fullyParsed');
  expect(result.value.operations).toMatchInlineSnapshot(`
            Array [
              Object {
                "type": "elementOpen",
                "value": Object {
                  "propertyValuePairs": Array [
                    Array [
                      "class",
                      "foo",
                    ],
                  ],
                  "tagName": "div",
                },
              },
              Object {
                "type": "elementOpen",
                "value": Object {
                  "propertyValuePairs": Array [],
                  "tagName": "h1",
                },
              },
              Object {
                "type": "text",
                "value": Object {
                  "text": "Hello",
                },
              },
              Object {
                "type": "elementClose",
                "value": Object {
                  "tagName": "h1",
                },
              },
              Object {
                "type": "elementOpen",
                "value": Object {
                  "propertyValuePairs": Array [
                    Array [
                      "class",
                      "content",
                    ],
                  ],
                  "tagName": "div",
                },
              },
              Object {
                "type": "elementOpen",
                "value": Object {
                  "propertyValuePairs": Array [],
                  "tagName": "strong",
                },
              },
              Object {
                "type": "text",
                "value": Object {
                  "text": "Test",
                },
              },
              Object {
                "type": "elementClose",
                "value": Object {
                  "tagName": "strong",
                },
              },
              Object {
                "type": "elementClose",
                "value": Object {
                  "tagName": "div",
                },
              },
              Object {
                "type": "elementClose",
                "value": Object {
                  "tagName": "div",
                },
              },
            ]
      `);
});

test('parses a partial fragment with nested tags', () => {
  // prettier-ignore
  let result = parseFragment('<div class="foo"><h1>Hello</h1><div class="content">');
  expect(result.type).toBe('fullyParsed');
  expect(result.value.operations).toMatchInlineSnapshot(`
    Array [
      Object {
        "type": "elementOpen",
        "value": Object {
          "propertyValuePairs": Array [
            Array [
              "class",
              "foo",
            ],
          ],
          "tagName": "div",
        },
      },
      Object {
        "type": "elementOpen",
        "value": Object {
          "propertyValuePairs": Array [],
          "tagName": "h1",
        },
      },
      Object {
        "type": "text",
        "value": Object {
          "text": "Hello",
        },
      },
      Object {
        "type": "elementClose",
        "value": Object {
          "tagName": "h1",
        },
      },
      Object {
        "type": "elementOpen",
        "value": Object {
          "propertyValuePairs": Array [
            Array [
              "class",
              "content",
            ],
          ],
          "tagName": "div",
        },
    },
    ]
  `);
});
