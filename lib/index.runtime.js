import Handlebars from 'handlebars/runtime';
import { registerHelperOverrides } from './helpers';
import * as runtime from './runtime';

// This file just imports the runtime Handlebars, which doesn't depend on Node globals
let HandlebarsIdom = {
  idom: runtime.getDefaultIdom(),
};

// The runtime doesn't include JavaScriptCompiler, which is the only component
// we've modified, so we can just export the default Handlebars members.
for (let key in Handlebars) {
  if (HandlebarsIdom[key] === undefined && key !== 'default') {
    HandlebarsIdom[key] = Handlebars[key];
  }
}

HandlebarsIdom.template = function(spec) {
  return runtime.template(spec, HandlebarsIdom);
};

HandlebarsIdom.patch = function(element, thunk, data) {
  return HandlebarsIdom.idom.patch(element, thunk, data);
};

registerHelperOverrides(HandlebarsIdom);

export default HandlebarsIdom;
