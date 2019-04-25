import { IdomImplementation } from './idom-implementation';
import { isEmptyElement } from '../empty-elements';

export type IdomToTextCallback = (idom: IdomImplementation) => void;

export function runIdomToText(callback: IdomToTextCallback): string {
  let buffer = '';
  callback({
    elementOpenStart(name, _key, staticAttrs) {
      let tagContents = generateTagContents(staticAttrs);
      buffer += `<${name}${tagContents}`;
    },
    attr(name, value) {
      buffer += generateTagContents([name, value]);
    },
    elementOpenEnd() {
      buffer += '>';
      return null;
    },
    elementVoid(name, _key, staticAttrs, ...dynamicAttrs) {
      let tagContents = generateTagContents(staticAttrs, dynamicAttrs);
      // HandlebarsInc uses `elementVoid()` for self-closing tags (also
      // referred to in the source as empty elements)
      buffer += `<${name}${tagContents}>`;
      return null;
    },
    elementOpen(name, _key, staticAttrs, ...dynamicAttrs) {
      let tagContents = generateTagContents(staticAttrs, dynamicAttrs);
      buffer += `<${name}${tagContents}>`;
      return null;
    },
    elementClose(name) {
      if (typeof name === 'string' && !isEmptyElement(name)) {
        buffer += `</${name}>`;
      }
      return null;
    },
    text(text) {
      buffer += text;
      return null;
    },
    currentElement() {
      return null;
    },
    currentPointer() {
      return null;
    },
    skip() {},
    skipNode() {},
    patch() {
      throw new Error('Patch not implemented for IDOM text backend');
    },
  });
  return buffer;
}

function generateTagContents(staticAttrs?: string[], dynamicAttrs?: string[]) {
  let attributes: string[] = [];
  if (staticAttrs != null) {
    attributes.push(...staticAttrs);
  }
  if (dynamicAttrs != null) {
    attributes.push(...dynamicAttrs);
  }
  let attributePairs: [string, string][] = [];
  let previousAttribute: string | undefined;
  attributes.forEach((value, index) => {
    if (index % 2 === 1) {
      attributePairs.push([previousAttribute!, value]);
    }
    previousAttribute = value;
  });
  let tagContents = '';
  for (let [key, value] of attributePairs) {
    if (value) {
      tagContents += ` ${key}="${value}"`;
    } else {
      // Empty attribute
      tagContents += ` ${key}`;
    }
  }
  return tagContents;
}
