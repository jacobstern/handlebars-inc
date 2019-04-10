import Handlebars from 'handlebars/runtime';
import { registerHelperOverrides } from './helpers';
import * as runtime from './runtime';

// This file just imports the runtime Handlebars, which doesn't depend on Node globals
let HandlebarsIDOM = {};

// The runtime doesn't include JavaScriptCompiler, which is the only component
// we've modified, so we can just export the default Handlebars members.
for (let key in Handlebars) {
  HandlebarsIDOM[key] = Handlebars[key];
}

let env = HandlebarsIDOM;

HandlebarsIDOM.template = function(spec) {
  return runtime.template(spec, env);
};

registerHelperOverrides(env);

export default HandlebarsIDOM;
