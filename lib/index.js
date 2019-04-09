import Handlebars from 'handlebars';
import JavaScriptCompiler from './compiler/javascript-compiler';
import { compile, precompile } from './vendor/handlebars/compiler/compiler';
import HandlebarsIDOM from './runtime';

// To avoid mismatches, copy the technique of the Handlebars lib and augment the
// existing global runtime object
for (let key in Handlebars) {
  HandlebarsIDOM[key] = Handlebars[key];
}

HandlebarsIDOM.JavaScriptCompiler = JavaScriptCompiler;

let env = HandlebarsIDOM;

HandlebarsIDOM.compile = function(input, options) {
  return compile(input, options, env);
};

HandlebarsIDOM.precompile = function(input, options) {
  return precompile(input, options, env);
};

export default HandlebarsIDOM;
