export type KeyValuePair = [string, string];

const QUOTED_ATTRIBUTE_REGEX = /(?:\s|^)([a-zA-Z\-\.\:_]+)\s*?=\s*?(['"])(.*?)\2/g;
const UNQUOTED_ATTRIBUTE_REGEX = /(?:\s|^)([a-zA-Z\-\.\:_]+)(?:\s*?=\s*?(\w+))?(?=\s|$)/g;

function getExhaustiveMatches(
  regex: RegExp,
  toMatch: string
): RegExpMatchArray[] {
  let allMatches: RegExpMatchArray[] = [];
  let result: string[] | null = null;
  while ((result = regex.exec(toMatch)) !== null) {
    allMatches.push(result);
  }
  regex.lastIndex = 0;
  return allMatches;
}

export function parseAttributes(content: string): KeyValuePair[] {
  const attributes: KeyValuePair[] = [];
  let noQuotes = '';
  let lastIndex = 0;
  for (let match of getExhaustiveMatches(QUOTED_ATTRIBUTE_REGEX, content)) {
    attributes.push([match[1], match[3]]);
    noQuotes += content.substring(lastIndex, match.index);
    lastIndex = Number(match.index) + match[0].length;
  }
  noQuotes += content.substring(lastIndex, content.length);
  for (let match of getExhaustiveMatches(UNQUOTED_ATTRIBUTE_REGEX, noQuotes)) {
    attributes.push([match[1], match[2] || '']);
  }
  return attributes;
}
