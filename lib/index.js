import Handlebars from 'handlebars';
import JavaScriptCompiler from './compiler/javascript-compiler';
import {
  compile,
  precompile
} from 'handlebars/lib/handlebars/compiler/compiler';

const HandlebarsIDOM = {};
for (const key in Handlebars) {
  HandlebarsIDOM[key] = Handlebars[key];
}

HandlebarsIDOM.JavaScriptCompiler = JavaScriptCompiler;

HandlebarsIDOM.compile = function(input, options) {
  return compile(input, options, HandlebarsIDOM);
};

HandlebarsIDOM.precompile = function(input, options) {
  return precompile(input, options, HandlebarsIDOM);
};

export default HandlebarsIDOM;
