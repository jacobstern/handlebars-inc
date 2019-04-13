import Handlebars from 'handlebars';
import JavaScriptCompiler from './compiler/javascript-compiler';
import { compile, precompile } from './vendor/handlebars/compiler/compiler';
import HandlebarsIdom from './index.runtime';

// To avoid mismatches, copy the technique of the Handlebars lib and augment the
// existing global runtime object
for (let key in Handlebars) {
  if (HandlebarsIdom[key] === undefined) {
    HandlebarsIdom[key] = Handlebars[key];
  }
}

HandlebarsIdom.JavaScriptCompiler = JavaScriptCompiler;

let env = HandlebarsIdom;

HandlebarsIdom.compile = function(input, options) {
  return compile(input, options, env);
};

HandlebarsIdom.precompile = function(input, options) {
  return precompile(input, options, env);
};

export default HandlebarsIdom;
