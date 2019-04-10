export interface ClosingTag {
  tagName: string;
}

export interface ClosingTagsInterstitialText {
  text: string;
}

export type ClosingTagsSource =
  | { type: 'closingTag'; value: ClosingTag }
  | { type: 'closingTagsInterstitialText'; value: ClosingTagsInterstitialText };

export interface ClosingTagsParseResult {
  tags: ClosingTagsSource[];
  remaining: string;
}

const CLOSING_TAG_REGEX = /^<\/([A-Za-z0-9]+)>/;

const INTERSTITIAL_TEXT_REGEX = /^[^<]+/;

export function parseClosingTags(fragment: string): ClosingTagsParseResult {
  let currentMatch: [ClosingTagsSource, string] | undefined; // [tag, remaining]
  let result = fragment.match(CLOSING_TAG_REGEX);
  if (result) {
    let [match, tagName] = result;
    currentMatch = [
      { type: 'closingTag', value: { tagName } },
      fragment.substr(match.length)
    ];
  } else if ((result = fragment.match(INTERSTITIAL_TEXT_REGEX))) {
    let [match] = result;
    currentMatch = [
      { type: 'closingTagsInterstitialText', value: { text: match } },
      fragment.substr(match.length)
    ];
  }
  if (currentMatch) {
    let [tag, remaining] = currentMatch;
    let rest = parseClosingTags(remaining);
    return {
      tags: [tag, ...rest.tags],
      remaining: rest.remaining
    };
  }
  // We are either at the end of the string, or beginning of an opening tag
  return { tags: [], remaining: fragment };
}
