import { IdomImplementation } from './idom-implementation';

export interface IdomToTextExtras {
  appendRaw: (text: string) => void;
}

export type IdomToTextCallback = (
  idom: IdomImplementation,
  extras: IdomToTextExtras
) => void;

export function runIdomToText(callback: IdomToTextCallback): string {
  let buffer = '';
  callback(
    {
      elementVoid(name, _key, staticAttrs, ...dynamicAttrs) {
        let tagContents = generateTagContents(staticAttrs, dynamicAttrs);
        // HandlebarsIdom uses `elementVoid()` for self-closing tags
        buffer += `<${name}${tagContents}>`;
      },
      elementOpen(name, _key, staticAttrs, ...dynamicAttrs) {
        let tagContents = generateTagContents(staticAttrs, dynamicAttrs);
        buffer += `<${name}${tagContents}>`;
      },
      elementClose(name) {
        buffer += `</${name}>`;
      },
      text(text) {
        buffer += text;
      },
    },
    {
      appendRaw: text => {
        buffer += text;
      },
    }
  );
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
