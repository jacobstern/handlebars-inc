import parse5 from 'parse5';
import { Chance } from 'chance';

let chance = new Chance();

export function generateElementKey(): string {
  return chance.hash({ length: 15 });
}

/**
 * Un-problematizes string comparison of HTML fragments, especially for
 * self-closing tags which can be ambiguous.
 *
 * For example, `normalizeHTMLFragment('<input>') === normalizeHTMLFragment('<input></input>')`.
 */
export function normalizeHTMLFragment(fragment: string): string {
  return parse5.serialize(parse5.parseFragment(fragment));
}

export function makeMockIdom() {
  return {
    elementOpen: jest.fn(),
    elementClose: jest.fn(),
    text: jest.fn(),
    patch: jest.fn().mockImplementation((_element, thunk) => {
      thunk();
    }),
  };
}
