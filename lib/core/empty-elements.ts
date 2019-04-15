const EMPTY_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

const EMPTY_ELEMENTS_SET = new Set(EMPTY_ELEMENTS);

export function isEmptyElement(tagName: string) {
  return EMPTY_ELEMENTS_SET.has(tagName);
}
