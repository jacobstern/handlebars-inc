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
    },
    elementVoid(name, _key, staticAttrs, ...dynamicAttrs) {
      let tagContents = generateTagContents(staticAttrs, dynamicAttrs);
      // HandlebarsIdom uses `elementVoid()` for self-closing tags (also
      // referred to in the source as empty elements)
      buffer += `<${name}${tagContents}>`;
    },
    elementOpen(name, _key, staticAttrs, ...dynamicAttrs) {
      let tagContents = generateTagContents(staticAttrs, dynamicAttrs);
      buffer += `<${name}${tagContents}>`;
    },
    elementClose(name) {
      if (typeof name === 'function') {
        throw new Error(
          'Unexpected element constructor function in incremental-dom call'
        );
      }
      if (!isEmptyElement(name)) {
        buffer += `</${name}>`;
      }
    },
    text(text) {
      buffer += text;
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
  attributePairs.forEach(([key, value]) => {
    tagContents += ` ${key}="${value}"`;
  });
  return tagContents;
}
