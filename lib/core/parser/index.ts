import parse5 from 'parse5';
import { DOMOperation, PropertyValuePair } from '../dom-operation';
import { parseClosingTags, ClosingTagsSource } from './closing-tags-parser';

export interface ParsedFullTags {
  operations: DOMOperation[];
}

export type ParseResult = {
  type: 'fullTags';
  value: ParsedFullTags;
};

function getRemainingText(
  fragment: string,
  ast: parse5.DefaultTreeDocumentFragment
): string {
  if (ast.childNodes.length) {
    let lastChild = ast.childNodes[ast.childNodes.length - 1];
    let elementLastChild = lastChild as parse5.DefaultTreeElement;
    let sourceLocation = elementLastChild.sourceCodeLocation;
    if (sourceLocation && sourceLocation.endOffset < fragment.length) {
      return fragment.slice(sourceLocation.endOffset);
    }
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
        text: textNode.value
      }
    });
  } else if (!node.nodeName.startsWith('#')) {
    // Hash prefix is used for other "special" node types like comments
    let elementNode = node as parse5.DefaultTreeElement;
    operations.push({
      type: 'elementOpen',
      value: {
        propertyValuePairs: getPropertyValuePairs(elementNode.attrs),
        tagName: elementNode.tagName
      }
    });
    elementNode.childNodes.forEach(node => {
      operations = operations.concat(getNodeDOMOperations(node));
    });
    let sourceCodeLocation = elementNode.sourceCodeLocation;
    if (sourceCodeLocation == null) {
      throw new Error('Tree must contain source info');
    }
    let hasClosingTag = Boolean(sourceCodeLocation.endTag);
    if (hasClosingTag) {
      operations.push({
        type: 'elementClose',
        value: { tagName: elementNode.tagName }
      });
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
    operations = operations.concat(getNodeDOMOperations(childNode));
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
            value: { tagName: tag.value.tagName }
          };
        }
        case 'closingTagsInterstitialText': {
          return {
            type: 'text',
            value: { text: tag.value.text }
          };
        }
      }
    }
  );
}

export function parseFragment(fragment: string): ParseResult {
  let operations: DOMOperation[] = [];
  // There may be unmatched closing tags at either the beginning or very end of
  // a valid fragment.
  // For example: '</div><p>...</p></div>'.
  let initialClosing = parseClosingTags(fragment);
  operations = operations.concat(getOperationsFromTags(initialClosing.tags));
  let remaining = initialClosing.remaining;
  let ast = parse5.parseFragment(remaining, { sourceCodeLocationInfo: true });
  let fragmentAst = ast as parse5.DefaultTreeDocumentFragment;
  // Sometimes if there are unmatched closing tags in the fragment, parse5 will
  // give us text nodes that extend past the closing tag. We need to rewind and
  // try to recover the closing tag.
  stripTrailingTextNodes(fragmentAst);
  operations = operations.concat(getFragmentDOMOperations(fragmentAst));
  remaining = getRemainingText(remaining, fragmentAst);
  let endingClosing = parseClosingTags(remaining);
  operations = operations.concat(getOperationsFromTags(endingClosing.tags));
  return { type: 'fullTags', value: { operations } };
}
