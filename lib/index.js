import AST from './handlebars-inc/vendor/handlebars/compiler/ast';
import {
  parser as Parser,
  parse,
} from './handlebars-inc/vendor/handlebars/compiler/base';
import * as compiler from './handlebars-inc/vendor/handlebars/compiler/compiler';
import { Compiler } from './handlebars-inc/vendor/handlebars/compiler/compiler';
import Visitor from './handlebars-inc/vendor/handlebars/compiler/visitor';
// Forked JavaScriptCompiler
import JavaScriptCompiler from './handlebars-inc/compiler/javascript-compiler';
import runtime from './runtime';

function create() {
  const hb = runtime.create();

  hb.compile = function(input, options) {
    return compiler.compile(input, options, hb);
  };

  hb.precompile = function(input, options) {
    return compiler.precompile(input, options, hb);
  };

  hb.AST = AST;
  hb.Compiler = Compiler;
  hb.JavaScriptCompiler = JavaScriptCompiler;
  hb.Parser = Parser;
  hb.parse = parse;
  hb.Visitor = Visitor;

  return hb;
}

const inst = create();
inst.create = create;

const compile = inst.compile;
const precompile = inst.precompile;

export {
  create,
  compile,
  precompile,
  AST,
  Compiler,
  JavaScriptCompiler,
  Parser,
  parse,
  Visitor,
};

export default inst;
