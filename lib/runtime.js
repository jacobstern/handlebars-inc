import Handlebars from 'handlebars/runtime';
import { registerHelperOverrides } from './handlebars-inc/helpers';
import * as runtime from './handlebars-inc/runtime';

// This file just imports the runtime Handlebars, which doesn't depend on Node globals
let HandlebarsInc = {
  idom: runtime.getDefaultIdom(),
};

// The runtime doesn't include JavaScriptCompiler, which is the only component
// we've modified, so we can just export the default Handlebars members.
for (let key in Handlebars) {
  if (HandlebarsInc[key] === undefined && key !== 'default') {
    HandlebarsInc[key] = Handlebars[key];
  }
}

HandlebarsInc.template = function(spec) {
  return runtime.template(spec, HandlebarsInc);
};

HandlebarsInc.patch = function(element, thunk, data) {
  return HandlebarsInc.idom.patch(element, thunk, data);
};

registerHelperOverrides(HandlebarsInc);

export default HandlebarsInc;
