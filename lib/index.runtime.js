import Handlebars from 'handlebars/runtime';
import { registerHelperOverrides } from './helpers';
import * as runtime from './runtime';

const defaultIncrementalDOM = runtime.getDefaultIncrementalDOM();
let customIncrementalDOM;

// This file just imports the runtime Handlebars, which doesn't depend on Node globals
let HandlebarsIDOM = {
  get IncrementalDOM() {
    if (customIncrementalDOM != null) {
      return customIncrementalDOM;
    }
    if (defaultIncrementalDOM != null) {
      return defaultIncrementalDOM;
    }
    throw new Error(
      [
        'HandlebarsIDOM.IncrementalDOM was not loaded, most likely because you',
        'are not running in a browser environment. If you think this is incorrect,',
        'you can set it manually.',
      ].join(' ')
    );
  },

  set IncrementalDOM(value) {
    customIncrementalDOM = value;
  },
};

// The runtime doesn't include JavaScriptCompiler, which is the only component
// we've modified, so we can just export the default Handlebars members.
for (let key in Handlebars) {
  if (HandlebarsIDOM[key] === undefined) {
    HandlebarsIDOM[key] = Handlebars[key];
  }
}

HandlebarsIDOM.IncrementalDOM = runtime.getDefaultIncrementalDOM();

let env = HandlebarsIDOM;

HandlebarsIDOM.template = function(spec) {
  return runtime.template(spec, env);
};

HandlebarsIDOM.patch = function(element, thunk, data) {
  return env.IncrementalDOM.patch(element, thunk, data);
};

registerHelperOverrides(env);

export default HandlebarsIDOM;
