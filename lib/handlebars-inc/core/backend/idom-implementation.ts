import * as IncrementalDOM from 'incremental-dom';

type Void<T extends (...args: any[]) => void> = (
  ...args: Parameters<T>
) => void;

export interface IdomImplementation {
  elementOpenStart: Void<typeof IncrementalDOM.elementOpenStart>;
  attr: Void<typeof IncrementalDOM.attr>;
  elementOpenEnd: Void<typeof IncrementalDOM.elementOpenEnd>;
  elementVoid: Void<typeof IncrementalDOM.elementVoid>;
  elementOpen: Void<typeof IncrementalDOM.elementOpen>;
  elementClose: Void<typeof IncrementalDOM.elementClose>;
  text: Void<typeof IncrementalDOM.text>;
}
