import { IDOMImplementation } from './idom-implementation';

export function runIDOMToText(
  callback: (idom: IDOMImplementation) => void
): string {
  let buffer = '';
  callback({
    elementOpen(name, _key, staticAttributes, ...dynamicAttributes) {
      let attributes: string[] = [];
      if (staticAttributes != null) {
        attributes.push(...staticAttributes);
      }
      if (dynamicAttributes != null) {
        attributes.push(...dynamicAttributes);
      }

      let attributePairs: [string, string][] = [];
      let previousAttribute: string | undefined;
      attributes.forEach((value, index) => {
        if (index % 2 === 1) {
          attributePairs.push([previousAttribute!, value]);
        }
        previousAttribute = value;
      });

      let attributesContent = '';
      attributePairs.forEach(([key, value]) => {
        attributesContent += ` ${key}="${value}"`;
      });

      buffer += `<${name}${attributesContent}>`;
    },
    elementClose(name) {
      buffer += `</${name}>`;
    },
    text(text) {
      buffer += text;
    },
  });
  return buffer;
}
