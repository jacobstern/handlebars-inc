import parse5 from 'parse5';
import { DOMOperation, PropertyValuePair } from '../dom-operation';
import { parseClosingTags, ClosingTagsSource } from './closing-tags-parser';
import { parseOpenPartialTag } from './partial-tags-parser';
import { isEmptyElement } from '../empty-elements';

export interface ParsedFullTags {
  operations: DOMOperation[];
}

export interface ParsedOpenPartialTag {
  leadingOperations: DOMOperation[];
  tagName: string;
  content: string;
}

export type ParseResult =
  | {
      type: 'fullTags';
      value: ParsedFullTags;
    }
  | {
      type: 'openPartialTag';
      value: ParsedOpenPartialTag;
    }
  | {
      type: 'invalidFragment';
    };

function getUnparsedLeadingText(
  fragment: string,
  ast: parse5.DefaultTreeDocumentFragment
): string {
  if (ast.childNodes.length === 0) {
    return fragment;
  }
  let firstChild = ast.childNodes[0];
  let elementFirstChild = firstChild as parse5.DefaultTreeElement;
  let sourceCodeLocation = elementFirstChild.sourceCodeLocation;
  if (sourceCodeLocation == null) {
    throw new Error('Tree must contain source info');
  }
  if (sourceCodeLocation.startOffset > 0) {
    return fragment.slice(0, sourceCodeLocation.startOffset);
  }
  return '';
}

function getRemainingText(
  fragment: string,
  ast: parse5.DefaultTreeDocumentFragment
): string {
  if (ast.childNodes.length === 0) {
    return fragment;
  }
  let lastChild = ast.childNodes[ast.childNodes.length - 1];
  let elementLastChild = lastChild as parse5.DefaultTreeElement;
  let sourceCodeLocation = elementLastChild.sourceCodeLocation;
  if (sourceCodeLocation == null) {
    throw new Error('Tree must contain source info');
  }
  if (sourceCodeLocation.endOffset < fragment.length) {
    return fragment.slice(sourceCodeLocation.endOffset);
  }
  return '';
}

function stripTrailingTextNodes(ast: parse5.DefaultTreeDocumentFragment) {
  let lastChild = ast.childNodes[ast.childNodes.length - 1];
  while (lastChild && lastChild.nodeName === '#text') {
    ast.childNodes.pop();
    lastChild = ast.childNodes[ast.childNodes.length - 1];
  }
}

function getPropertyValuePairs(
  attributes: parse5.Attribute[]
): PropertyValuePair[] {
  return attributes.map(
    (attribute): PropertyValuePair => [attribute.name, attribute.value]
  );
}

function getNodeDOMOperations(node: parse5.DefaultTreeNode): DOMOperation[] {
  let operations: DOMOperation[] = [];
  if (node.nodeName === '#text') {
    let textNode = node as parse5.DefaultTreeTextNode;
    operations.push({
      type: 'text',
      value: {
        text: textNode.value,
      },
    });
  } else if (!node.nodeName.startsWith('#')) {
    // Hash prefix is used for other "special" node types like comments
    let elementNode = node as parse5.DefaultTreeElement;
    if (isEmptyElement(elementNode.tagName)) {
      operations.push({
        type: 'emptyElement',
        value: {
          propertyValuePairs: getPropertyValuePairs(elementNode.attrs),
          tagName: elementNode.tagName,
        },
      });
    } else {
      operations.push({
        type: 'elementOpen',
        value: {
          propertyValuePairs: getPropertyValuePairs(elementNode.attrs),
          tagName: elementNode.tagName,
        },
      });
      elementNode.childNodes.forEach(node => {
        operations.push(...getNodeDOMOperations(node));
      });
      let sourceCodeLocation = elementNode.sourceCodeLocation;
      if (sourceCodeLocation == null) {
        throw new Error('Tree must contain source info');
      }
      let hasClosingTag = Boolean(sourceCodeLocation.endTag);
      if (hasClosingTag) {
        operations.push({
          type: 'elementClose',
          value: { tagName: elementNode.tagName },
        });
      }
    }
  }
  return operations;
}

function getFragmentDOMOperations(
  ast: parse5.DefaultTreeDocumentFragment
): DOMOperation[] {
  let operations: DOMOperation[] = [];
  ast.childNodes.forEach(child => {
    let childNode = child as parse5.DefaultTreeNode;
    operations.push(...getNodeDOMOperations(childNode));
  });
  return operations;
}

function getOperationsFromTags(tags: ClosingTagsSource[]): DOMOperation[] {
  return tags.map(
    (tag): DOMOperation => {
      switch (tag.type) {
        case 'closingTag': {
          return {
            type: 'elementClose',
            value: { tagName: tag.value.tagName },
          };
        }
        case 'closingTagsInterstitialText': {
          return {
            type: 'text',
            value: { text: tag.value.text },
          };
        }
      }
    }
  );
}

export function parseFragment(fragment: string): ParseResult {
  if (fragment === '') {
    return {
      type: 'fullTags',
      value: { operations: [] },
    };
  }
  if (fragment.indexOf('<') === -1 && fragment.indexOf('>') === -1) {
    // As an optimization, bail out early if there are no HTML tags here
    return {
      type: 'fullTags',
      value: { operations: [{ type: 'text', value: { text: fragment } }] },
    };
  }
  let operations: DOMOperation[] = [];
  // There may be unmatched closing tags at either the beginning or very end of
  // a valid fragment.
  // For example: '</div><p>...</p></div>'.
  let initialClosing = parseClosingTags(fragment);
  operations.push(...getOperationsFromTags(initialClosing.tags));
  let remaining = initialClosing.remaining;
  let ast = parse5.parseFragment(remaining, { sourceCodeLocationInfo: true });
  let fragmentAst = ast as parse5.DefaultTreeDocumentFragment;
  let leadingText = getUnparsedLeadingText(remaining, fragmentAst);
  if (leadingText.length > 0) {
    return { type: 'invalidFragment' };
  }
  // Sometimes if there are unmatched closing tags in the fragment, parse5 will
  // give us text nodes that extend past the closing tag. We need to rewind and
  // try to recover the closing tag.
  stripTrailingTextNodes(fragmentAst);
  operations.push(...getFragmentDOMOperations(fragmentAst));
  let remainingAfterFragmentParse = getRemainingText(remaining, fragmentAst);
  let endingClosing = parseClosingTags(remainingAfterFragmentParse);
  operations.push(...getOperationsFromTags(endingClosing.tags));
  // There might be the start of a tag like <input type=" lurking at the end.
  // Include the text that was previously parsed by parse5 since the partial tag
  // might not have been extracted by getRemainingText().
  let openPartialTag = parseOpenPartialTag(remaining);
  if (openPartialTag) {
    let { tagName } = openPartialTag;
    return {
      type: 'openPartialTag',
      value: {
        leadingOperations: operations,
        tagName,
        content: openPartialTag.content,
      },
    };
  }
  // At this point we can probably trust that the content is invalid
  if (endingClosing.remaining.length > 0) {
    return { type: 'invalidFragment' };
  }
  return { type: 'fullTags', value: { operations } };
}
