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

// Don't want to require a Set() polyfill
const EMPTY_ELEMENTS_OBJ: { [key: string]: boolean | undefined } = {};

for (let element of EMPTY_ELEMENTS) {
  EMPTY_ELEMENTS_OBJ[element] = true;
}

export function isEmptyElement(tagName: string): boolean {
  return (
    EMPTY_ELEMENTS_OBJ.hasOwnProperty(tagName) &&
    Boolean(EMPTY_ELEMENTS_OBJ[tagName])
  );
}
