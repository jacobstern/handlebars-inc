import * as IncrementalDOM from 'incremental-dom';

type MaybeNull<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T> | null;

export interface IdomImplementation {
  elementOpenStart: MaybeNull<typeof IncrementalDOM.elementOpenStart>;
  attr: MaybeNull<typeof IncrementalDOM.attr>;
  elementOpenEnd: MaybeNull<typeof IncrementalDOM.elementOpenEnd>;
  elementVoid: MaybeNull<typeof IncrementalDOM.elementVoid>;
  elementOpen: MaybeNull<typeof IncrementalDOM.elementOpen>;
  elementClose: MaybeNull<typeof IncrementalDOM.elementClose>;
  text: MaybeNull<typeof IncrementalDOM.text>;
  currentElement: MaybeNull<typeof IncrementalDOM.currentElement>;
  currentPointer: MaybeNull<typeof IncrementalDOM.currentPointer>;
  skip: typeof IncrementalDOM.skip;
  skipNode: typeof IncrementalDOM.skipNode;
  patch: MaybeNull<typeof IncrementalDOM.patch>;
}
