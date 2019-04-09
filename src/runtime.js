import * as IncrementalDOM from 'incremental-dom';
import HandlebarsIDOM from '../lib/index.runtime';

if (window.IncrementalDOM == null) {
  // TODO: Allow user-defined IncrementalDOM global as well.

  // To what extent do we expect this library to rely on a specific version of
  // incremental-dom?
  window.IncrementalDOM = IncrementalDOM;
}

window.HandlebarsIDOM = HandlebarsIDOM;
