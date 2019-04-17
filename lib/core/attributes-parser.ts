export type KeyValuePair = [string, string | undefined];

const QUOTED_ATTRIBUTE_REGEX = /\s([a-zA-Z\-\.\:\:_]+)\s*?=\s*?"(.*?)"/g;
const SINGLE_ATTRIBUTE_REGEX = /\s([a-zA-Z\-\.\:_]+)\s*?=\s*?'(.*?)'/g;
const UNQUOTED_ATTRIBUTE_REGEX = /\s([a-zA-Z\-\.\:_]+)\s*?=\s*?(\w+)(?:\s|$)/g;
const EMPTY_ATTRIBUTE_REGEX = /\s([a-zA-Z\-\.\:_]+)(?:\s|$)/g;

function getExhaustiveMatches(regex: RegExp, toMatch: string): string[][] {
  let allMatches: string[][] = [];
  let result: string[] | null = null;
  while ((result = regex.exec(toMatch)) !== null) {
    allMatches.push(result);
  }
  regex.lastIndex = 0;
  return allMatches;
}

export function parseAttributes(content: string): KeyValuePair[] {
  const attributes: KeyValuePair[] = [];
  for (let match of getExhaustiveMatches(QUOTED_ATTRIBUTE_REGEX, content)) {
    attributes.push([match[1], match[2]]);
  }
  // FIXME: I haven't validated this micro-optimization, or anything about the
  // performance of this function
  if (content.indexOf("'") !== -1) {
    for (let match of getExhaustiveMatches(SINGLE_ATTRIBUTE_REGEX, content)) {
      attributes.push([match[1], match[2]]);
    }
  }
  for (let match of getExhaustiveMatches(UNQUOTED_ATTRIBUTE_REGEX, content)) {
    attributes.push([match[1], match[2]]);
  }
  for (let match of getExhaustiveMatches(EMPTY_ATTRIBUTE_REGEX, content)) {
    attributes.push([match[1], '']);
  }
  return attributes;
}
