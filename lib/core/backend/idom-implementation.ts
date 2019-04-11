import * as IncrementalDOM from 'incremental-dom';

type Void<T extends (...args: any[]) => void> = (
  ...args: Parameters<T>
) => void;

export interface IDOMImplementation {
  elementOpen: Void<typeof IncrementalDOM.elementOpen>;
  elementClose: Void<typeof IncrementalDOM.elementClose>;
  text: Void<typeof IncrementalDOM.text>;
}
