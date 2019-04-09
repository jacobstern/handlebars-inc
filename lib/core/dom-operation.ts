export type PropertyValuePair = [string, string];

export interface TextOperation {
  text: string;
}

export interface ElementOpenOperation {
  tagName: string;
  propertyValuePairs: PropertyValuePair[];
}

export interface ElementCloseOperation {
  tagName: string;
}

export type DOMOperation =
  | { type: 'text'; value: TextOperation }
  | { type: 'elementOpen'; value: ElementOpenOperation }
  | { type: 'elementClose'; value: ElementCloseOperation };
