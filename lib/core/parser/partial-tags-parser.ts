export interface OpenPartialTag {
  tagName: string;
  content: string;
}

export interface PartialTagEnd {
  content: string;
  remaining: string;
}

const OPEN_PARTIAL_TAG_REGEX = /^<([a-zA-Z]+)(?=\s)/;

export function parseOpenPartialTag(
  fragment: string
): OpenPartialTag | undefined {
  let match = fragment.match(OPEN_PARTIAL_TAG_REGEX);
  if (match != null) {
    let [entire, tagName] = match;
    return {
      tagName,
      content: fragment.substring(entire.length),
    };
  }
}

export function parsePartialTagEnd(
  fragment: string
): PartialTagEnd | undefined {
  let index = fragment.indexOf('>');
  if (index !== -1) {
    return {
      content: fragment.substring(0, index),
      remaining: fragment.substring(index + 1),
    };
  }
}
