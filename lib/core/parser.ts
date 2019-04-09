import parse5 from 'parse5';
import { DOMOperation } from './dom-operation';

export interface FullyParsedResult {
  operations: DOMOperation[];
}

export type ParseResult = {
  type: 'fully-parsed';
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

function getTextNodesNaive(
  ast: parse5.DefaultTreeDocumentFragment
): DOMOperation[] {
  let operations: DOMOperation[] = [];
  ast.childNodes.forEach(child => {
    const childNode = child as parse5.DefaultTreeNode;
    if (childNode.nodeName === '#text') {
      const elementText = childNode as parse5.DefaultTreeTextNode;
      operations.push({
        type: 'text',
        value: {
          text: elementText.value
        }
      });
    }
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
    type: 'fully-parsed',
    value: {
      operations: getTextNodesNaive(fragmentAst)
    }
  };
}
