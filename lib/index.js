import Handlebars from 'handlebars';
import JavaScriptCompiler from './handlebars-inc/compiler/javascript-compiler';
import * as Compiler from './handlebars-inc/vendor/handlebars/compiler/compiler';
import HandlebarsInc from './runtime';

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
  return Compiler.compile(input, options, env);
};

HandlebarsInc.precompile = function(input, options) {
  return Compiler.precompile(input, options, env);
};

export default HandlebarsInc;
