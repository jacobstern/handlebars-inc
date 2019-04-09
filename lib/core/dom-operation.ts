export interface TextOperation {
  text: string;
}

export type DOMOperation = { type: 'text'; value: TextOperation };
