import parse5 from 'parse5';
import { DOMOperation, PropertyValuePair } from './dom-operation';

export interface FullyParsedResult {
  operations: DOMOperation[];
}

export type ParseResult = {
  type: 'fullyParsed';
  value: FullyParsedResult;
};

function getTrailingJunk(
  fragment: string,
  ast: parse5.DefaultTreeDocumentFragment
): string | undefined {
  if (ast.childNodes.length) {
    let lastChild = ast.childNodes[ast.childNodes.length - 1];
    let elementLastChild = lastChild as parse5.DefaultTreeElement;
    let sourceLocation = elementLastChild.sourceCodeLocation;
    if (sourceLocation && sourceLocation.endOffset < fragment.length) {
      return fragment.slice(sourceLocation.endOffset);
    }
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

export function parseFragment(fragment: string): ParseResult {
  let ast = parse5.parseFragment(fragment, { sourceCodeLocationInfo: true });
  let fragmentAst = ast as parse5.DefaultTreeDocumentFragment;
  let trailingJunk = getTrailingJunk(fragment, fragmentAst);
  if (trailingJunk) {
    throw new Error(`Not implemented: trailing junk in source ${trailingJunk}`);
  }
  return {
    type: 'fullyParsed',
    value: {
      operations: getFragmentDOMOperations(fragmentAst)
    }
  };
}
