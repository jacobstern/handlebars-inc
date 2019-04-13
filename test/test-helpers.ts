import parse5 from 'parse5';
import { Chance } from 'chance';

let chance = new Chance();

export function generateElementKey() {
  return chance.hash({ length: 15 });
}

/**
 * Un-problematizes string comparison of HTML fragments, especially for
 * self-closing tags which can be ambiguous.
 *
 * For example, `normalizeHTMLFragment('<input>') === normalizeHTMLFragment('<input></input>')`.
 */
export function normalizeHTMLFragment(fragment) {
  return parse5.serialize(parse5.parseFragment(fragment));
}
