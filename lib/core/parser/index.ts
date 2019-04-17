import parse5 from 'parse5';
import { DOMOperation, PropertyValuePair } from '../dom-operation';
import { parseClosingTags, ClosingTagsSource } from './closing-tags-parser';
import { parseOpenPartialTag } from './partial-tags-parser';
import * as partial from './partial-tags-parser';
import { isEmptyElement } from '../empty-elements';
export { parsePartialTagEnd } from './partial-tags-parser';

export type PartialTagEnd = partial.PartialTagEnd;

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

interface HasLocation {
  sourceCodeLocation?: parse5.Location;
}

interface ElementLocation extends parse5.Location {
  startTag: parse5.StartTagLocation;
  endTag?: parse5.Location;
}

function demandLocation(node: parse5.DefaultTreeNode): parse5.Location {
  if (node.hasOwnProperty('sourceCodeLocation')) {
    const withSource = node as HasLocation;
    const sourceCodeLocation = withSource.sourceCodeLocation;
    if (sourceCodeLocation) {
      return sourceCodeLocation;
    }
  }
  throw new Error('Tree must contain source info');
}

function demandElementLocation(node: parse5.DefaultTreeNode): ElementLocation {
  const sourceCodeLocation = demandLocation(node);
  if (sourceCodeLocation.hasOwnProperty('startTag')) {
    return sourceCodeLocation as ElementLocation;
  }
  throw new Error('Expected source code info to have startTag');
}

function getPropertyValuePairs(
  attributes: parse5.Attribute[]
): PropertyValuePair[] {
  return attributes.map(
    (attribute): PropertyValuePair => [attribute.name, attribute.value]
  );
}

const HTML_RESERVED_CHARACTERS_REGEX = /['"&<>]/g;

interface ValidOperations {
  operations: DOMOperation[];
  endOffset: number;
}

function getNodeDOMOperations(
  node: parse5.DefaultTreeNode,
  fragment: string,
  startOffset: number
): ValidOperations | undefined {
  const operations: DOMOperation[] = [];
  const sourceLocation = demandLocation(node);
  if (sourceLocation.startOffset > startOffset) {
    // Handle leading garbage
    const garbage = fragment.substring(startOffset, sourceLocation.startOffset);
    const closingTags = parseClosingTags(garbage);
    if (closingTags.remaining) {
      return undefined;
    }
    operations.push(...getOperationsFromClosingTags(closingTags.tags));
  }
  if (node.nodeName === '#text') {
    const textNode = node as parse5.DefaultTreeTextNode;
    const textSource = fragment.substring(
      sourceLocation.startOffset,
      sourceLocation.endOffset
    );
    if (textSource.match(HTML_RESERVED_CHARACTERS_REGEX)) {
      // parse5 will ignore unmatched closing tags inside a text node
      const closingTags = parseClosingTags(textSource);
      operations.push(...getOperationsFromClosingTags(closingTags.tags));
      return {
        operations,
        endOffset: sourceLocation.endOffset - closingTags.remaining.length,
      };
    } else {
      operations.push({
        type: 'text',
        value: {
          text: textNode.value,
        },
      });
    }
  } else if (!node.nodeName.startsWith('#')) {
    // Hash prefix is used for other "special" node types like comments
    const elementNode = node as parse5.DefaultTreeElement;
    const elementLocation = demandElementLocation(node);
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
      const contentsStartOffset = elementLocation.startTag.endOffset;
      let offset = contentsStartOffset;
      for (let node of elementNode.childNodes) {
        const intermediateResult = getNodeDOMOperations(node, fragment, offset);
        if (intermediateResult) {
          operations.push(...intermediateResult.operations);
          offset = intermediateResult.endOffset;
        } else {
          // Parse failure
          return intermediateResult;
        }
      }
      const endTagLocation = elementLocation.endTag;
      if (endTagLocation) {
        const contentsEndOffset = endTagLocation.startOffset;
        if (offset < contentsEndOffset) {
          // Garbage inside of tags
          const remaining = fragment.substring(offset, contentsEndOffset);
          const closingTags = parseClosingTags(remaining);
          if (closingTags.remaining) {
            return undefined;
          } else {
            operations.push(...getOperationsFromClosingTags(closingTags.tags));
          }
        }
        operations.push({
          type: 'elementClose',
          value: { tagName: elementNode.tagName },
        });
      } else {
        // Can't trust sourceLocation.endOffset, there may be trailing garbage
        // that is nonetheless included in the source range
        return {
          operations,
          endOffset: offset,
        };
      }
    }
  }
  return {
    operations,
    endOffset: sourceLocation.endOffset,
  };
}

function parseFromAST(
  ast: parse5.DefaultTreeDocumentFragment,
  fragment: string
): ParseResult {
  const operations: DOMOperation[] = [];
  let offset = 0;
  for (let child of ast.childNodes) {
    const intermediateResult = getNodeDOMOperations(
      child as parse5.DefaultTreeNode,
      fragment,
      offset
    );
    if (intermediateResult) {
      operations.push(...intermediateResult.operations);
      offset = intermediateResult.endOffset;
    } else {
      // Parse failed
      return { type: 'invalidFragment' };
    }
  }
  const remaining = fragment.substring(offset);
  const closingTags = parseClosingTags(remaining);
  operations.push(...getOperationsFromClosingTags(closingTags.tags));
  if (closingTags.remaining) {
    const partialTag = parseOpenPartialTag(closingTags.remaining);
    if (partialTag) {
      return {
        type: 'openPartialTag',
        value: {
          leadingOperations: operations,
          tagName: partialTag.tagName,
          content: partialTag.content,
        },
      };
    }
    return { type: 'invalidFragment' };
  }
  return { type: 'fullTags', value: { operations } };
}

function getOperationsFromClosingTags(
  tags: ClosingTagsSource[]
): DOMOperation[] {
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
  const ast = parse5.parseFragment(fragment, { sourceCodeLocationInfo: true });
  return parseFromAST(ast as parse5.DefaultTreeDocumentFragment, fragment);
}
