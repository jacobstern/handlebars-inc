import Handlebars from 'handlebars';
import JavaScriptCompiler from './compiler/javascript-compiler';
import { compile, precompile } from './vendor/handlebars/compiler/compiler';
import HandlebarsInc from './index.runtime';

// To avoid mismatches, copy the technique of the Handlebars lib and augment the
// existing global runtime object
for (let key in Handlebars) {
  if (HandlebarsInc[key] === undefined && key !== 'default') {
    HandlebarsInc[key] = Handlebars[key];
  }
}

HandlebarsInc.JavaScriptCompiler = JavaScriptCompiler;

let env = HandlebarsInc;

HandlebarsInc.compile = function(input, options) {
  return compile(input, options, env);
};

HandlebarsInc.precompile = function(input, options) {
  return precompile(input, options, env);
};

export default HandlebarsInc;
