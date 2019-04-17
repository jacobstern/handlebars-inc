export interface OpenPartialTag {
  tagName: string;
  content: string;
}

export interface PartialTagEnd {
  content: string;
  remaining: string;
}

const OPEN_PARTIAL_TAG_REGEX = /^<([a-zA-Z]+)(\s+[^>]*)$/;

export function parseOpenPartialTag(
  fragment: string
): OpenPartialTag | undefined {
  let match = fragment.match(OPEN_PARTIAL_TAG_REGEX);
  if (match != null) {
    let tagName = match[1];
    let content = match[2];
    return { tagName, content };
  }
}

export function parsePartialTagEnd(
  fragment: string
): PartialTagEnd | undefined {
  // This is obviously simplistic but should work well enough for our use case
  let index = fragment.indexOf('>');
  if (index !== -1) {
    return {
      content: fragment.substring(0, index),
      remaining: fragment.substring(index + 1),
    };
  }
}
