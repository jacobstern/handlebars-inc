import shortid from 'shortid';
import { COMPILER_REVISION, REVISION_CHANGES } from '../vendor/handlebars/base';
import Exception from '../vendor/handlebars/exception';
import CodeGen from '../vendor/handlebars/compiler/code-gen';
import { parseFragment, parsePartialTagEnd } from '../core/parser';
import { isEmptyElement } from '../core/empty-elements';

/* eslint-disable no-unreachable */

function Literal(value) {
  this.value = value;
}

function logOpCode(name, args = []) {
  // eslint-disable-next-line no-undef
  if (process && process.env && process.env.DEBUG_OPCODES) {
    // eslint-disable-next-line no-console
    console.debug(`[${name}]`, ...args);
  }
}

function JavaScriptCompiler() { }

JavaScriptCompiler.prototype = {
  // PUBLIC API: You can override these methods in a subclass to provide
  // alternative compiled forms for name lookup and buffering semantics
  nameLookup: function(parent, name/* , type*/) {
    if (name === 'constructor') {
      return ['(', parent, '.propertyIsEnumerable(\'constructor\') ? ', parent, '.constructor : undefined', ')'];
    }
    if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
      return [parent, '.', name];
    } else {
      return [parent, '[', JSON.stringify(name), ']'];
    }
  },
  depthedLookup: function(name) {
    return [this.aliasable('c.lookup'), '(depths, "', name, '")'];
  },

  compilerInfo: function() {
    const revision = COMPILER_REVISION,
          versions = REVISION_CHANGES[revision];
    return [revision, versions ];
  },

  initializeBuffer: function() {
    return this.quotedString('');
  },
  // END PUBLIC API

  compile: function(environment, options, context, asObject) {
    this.environment = environment;
    this.options = options;
    this.precompile = !asObject;

    this.name = this.environment.name;
    this.isChild = !!context;
    this.context = context || {
      decorators: [],
      programs: [],
      environments: []
    };

    this.preamble();

    this.stackSlot = 0;
    this.stackVars = [];
    this.aliases = {};
    this.registers = { list: [] };
    this.hashes = [];
    this.compileStack = [];
    this.inlineStack = [];
    this.blockParams = [];
    this.isPartialTag = false;
    this.partialTagName = undefined;

    this.compileChildren(environment, options);

    this.useDepths = this.useDepths || environment.useDepths || environment.useDecorators || this.options.compat;
    this.useBlockParams = this.useBlockParams || environment.useBlockParams;

    let opcodes = environment.opcodes,
        opcode,
        firstLoc,
        i,
        l;

    for (i = 0, l = opcodes.length; i < l; i++) {
      opcode = opcodes[i];

      this.source.currentLocation = opcode.loc;
      firstLoc = firstLoc || opcode.loc;
      this[opcode.opcode].apply(this, opcode.args);
    }

    // Flush any trailing content that might be pending.
    this.source.currentLocation = firstLoc;
    this.pushSource('');

    if (this.isPartialTag) {
      throw new Exception('Unclosed partial tag in template source');
    }

    /* istanbul ignore next */
    if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
      throw new Exception('Compile completed with content left on stack');
    }

    if (!this.decorators.isEmpty()) {
      throw new Error('Decorators are not implemented for handlebars-idom');
    } else {
      this.decorators = undefined;
    }

    let isRoot = !this.isChild;
    let fn = this.createFunctionContext(asObject, isRoot);
    if (isRoot) {
      let ret = {
        compiler: this.compilerInfo(),
        main: fn
      };

      if (this.decorators) {
        ret.main_d = this.decorators; // eslint-disable-line camelcase
        ret.useDecorators = true;
      }

      let {programs, decorators} = this.context;
      for (i = 0, l = programs.length; i < l; i++) {
        if (programs[i]) {
          ret[i] = programs[i];
          if (decorators[i]) {
            ret[i + '_d'] = decorators[i];
            ret.useDecorators = true;
          }
        }
      }

      if (this.environment.usePartial) {
        ret.usePartial = true;
      }
      if (this.options.data) {
        ret.useData = true;
      }
      if (this.useDepths) {
        ret.useDepths = true;
      }
      if (this.useBlockParams) {
        ret.useBlockParams = true;
      }
      if (this.options.compat) {
        ret.compat = true;
      }

      if (!asObject) {
        ret.compiler = JSON.stringify(ret.compiler);

        this.source.currentLocation = {start: {line: 1, column: 0}};
        ret = this.objectLiteral(ret);

        if (options.srcName) {
          ret = ret.toStringWithSourceMap({file: options.destName});
          ret.map = ret.map && ret.map.toString();
        } else {
          ret = ret.toString();
        }
      } else {
        ret.compilerOptions = this.options;
      }

      return ret;
    } else {
      return fn;
    }
  },
  
  generateIdomCall: function (method, args) {
    return this.source.functionCall(`c.idom.${method}`, '', args) + ';';
  },

  generateStatics: function (valuePairs) {
    let flattened = [];
    for (let [l, r] of valuePairs) {
      flattened.push(l);
      flattened.push(r);
    }
    return this.source.generateArray(flattened.map(entry => this.quotedString(entry)));
  },

  getGeneratedId() {
    return shortid.generate();
  },

  generateCallForDOMOperation: function (op) {
    switch (op.type) {
      case 'text': {
        return this.generateIdomCall(
          'text',
          [
            this.quotedString(op.value.text)
          ]);
      }
      case 'emptyElement': {
        return this.generateIdomCall(
          'elementVoid',
          [
            this.quotedString(op.value.tagName),
            // Generate a default key for each element, to avoid extra thrashing.
            // This strategy is suggested in the docs: http://google.github.io/incremental-dom/#keys-and-arrays.
            this.quotedString(this.getGeneratedId()),
            this.generateStatics(op.value.propertyValuePairs)
          ]
        );
      }
      case 'elementOpen': {
        return this.generateIdomCall(
          'elementOpen',
          [
            this.quotedString(op.value.tagName),
            this.quotedString(this.getGeneratedId()),
            this.generateStatics(op.value.propertyValuePairs)
          ]);
      }
      case 'elementClose': {
        return this.generateIdomCall(
          'elementClose',
          [
            this.quotedString(op.value.tagName)
          ]
        );
      }
    }
  },

  initPartialTagClosure: function (content) {
    this.source.push('(function () {\n');
    this.source.push('var res = container.runIdomToText(function (idom) {\n');
    this.source.push('var c = container.extend({}, container, {idom: idom, noEscape: true});\n');
    if (content) {
      this.source.push(this.generateIdomCall('text', [this.quotedString(content)]));
    }
  },

  finalizePartialTag: function (tagName) {
    this.source.push('});\n');
    this.source.push(this.source.functionCall('container.buildDynamicOpeningTag', null, [
      this.quotedString(tagName),
      this.quotedString(this.getGeneratedId()),
      'res',
    ]) + ';\n');
    if (isEmptyElement(tagName)) {
      this.source.push(this.generateIdomCall('elementClose', [this.quotedString(tagName)]));
    }
    this.source.push('})();\n');
  },

  pushDOMSource: function (content) {
    let parseResult = parseFragment(content);
    switch (parseResult.type) {
      case 'openPartialTag': {
        for (let op of parseResult.value.leadingOperations) {
          this.source.push(this.generateCallForDOMOperation(op));
        }
        this.initPartialTagClosure(parseResult.value.content);
        this.isPartialTag = true;
        this.partialTagName = parseResult.value.tagName;
        break;
      }
      case 'fullTags': {
        for (let op of parseResult.value.operations) {
          this.source.push(this.generateCallForDOMOperation(op));  
        }
        break;
      }
      case 'invalidFragment': {
       // Not a real HTML fragment, let's try to append it as text
       this.appendParseFallbackText(content);
       break;
      }
    }
  },

  appendResult: function (source) {
    let append = this.source.functionCall('c.appendResult', null, [source]);
    this.pushSource(append);
  },

  appendParseFallbackText: function (text) {
    let append = this.source.functionCall('c.appendResult', null, [this.quotedString(text)]);
    this.source.push(append);
  },

  preamble: function() {
    // track the last context pushed into place to allow skipping the
    // getContext opcode when it would be a noop
    this.lastContext = 0;
    this.source = new CodeGen(this.options.srcName);
    this.decorators = new CodeGen(this.options.srcName);
  },

  createFunctionContext: function(asObject) {
    let varDeclarations = '';

    let locals = this.stackVars.concat(this.registers.list);
    if (locals.length > 0) {
      varDeclarations += ', ' + locals.join(', ');
    }

    // Generate minimizer alias mappings
    //
    // When using true SourceNodes, this will update all references to the given alias
    // as the source nodes are reused in situ. For the non-source node compilation mode,
    // aliases will not be used, but this case is already being run on the client and
    // we aren't concern about minimizing the template size.
    let aliasCount = 0;
    for (let alias in this.aliases) { // eslint-disable-line guard-for-in
      let node = this.aliases[alias];

      if (this.aliases.hasOwnProperty(alias) && node.children && node.referenceCount > 1) {
        varDeclarations += ', alias' + (++aliasCount) + '=' + alias;
        node.children[0] = 'alias' + aliasCount;
      }
    }

    if (varDeclarations.length > 0) {
      this.source.prepend('var ' + varDeclarations.substring(2) + ';\n');
    }

    this.source.prepend('var c = container;');

    let params = ['container', 'depth0', 'helpers', 'partials', 'data'];

    if (this.useBlockParams || this.useDepths) {
      params.push('blockParams');
    }
    if (this.useDepths) {
      params.push('depths');
    }

    let source = this.source.merge();
    let thunk = this.source.wrap(['return function() {\n', source, '};']);
    if (asObject) {
      params.push(thunk);
      return Function.apply(this, params);
    } else {
      return this.source.wrap(['function(', params.join(','), ') {\n  ', thunk, '}']);
    }
  },

  mergeSource: function(varDeclarations) {
    let isSimple = this.environment.isSimple,
        appendOnly = !this.forceBuffer,
        appendFirst,

        sourceSeen,
        bufferStart,
        bufferEnd;
    this.source.each((line) => {
      if (line.appendToBuffer) {
        if (bufferStart) {
          line.prepend('  + ');
        } else {
          bufferStart = line;
        }
        bufferEnd = line;
      } else {
        if (bufferStart) {
          if (!sourceSeen) {
            appendFirst = true;
          } else {
            bufferStart.prepend('buffer += ');
          }
          bufferEnd.add(';');
          bufferStart = bufferEnd = undefined;
        }

        sourceSeen = true;
        if (!isSimple) {
          appendOnly = false;
        }
      }
    });


    if (appendOnly) {
      if (bufferStart) {
        bufferStart.prepend('return ');
        bufferEnd.add(';');
      } else if (!sourceSeen) {
        this.source.push('return "";');
      }
    } else {
      varDeclarations += ', buffer = ' + (appendFirst ? '' : this.initializeBuffer());

      if (bufferStart) {
        bufferStart.prepend('return buffer + ');
        bufferEnd.add(';');
      } else {
        this.source.push('return buffer;');
      }
    }

    if (varDeclarations) {
      this.source.prepend('var ' + varDeclarations.substring(2) + (appendFirst ? '' : ';\n'));
    }

    return this.source.merge();
  },

  // [blockValue]
  //
  // On stack, before: hash, inverse, program, value
  // On stack, after: return value of blockHelperMissing
  //
  // The purpose of this opcode is to take a block of the form
  // `{{#this.foo}}...{{/this.foo}}`, resolve the value of `foo`, and
  // replace it on the stack with the result of properly
  // invoking blockHelperMissing.
  blockValue: function(name) {
    logOpCode('blockValue', arguments);
    let blockHelperMissing = this.aliasable('helpers.blockHelperMissing'),
        params = [this.contextName(0)];
    this.setupHelperArgs(name, 0, params);

    let blockName = this.popStack();
    params.splice(1, 0, blockName);

    this.push(this.source.functionCall(blockHelperMissing, 'call', params));
  },

  // [ambiguousBlockValue]
  //
  // On stack, before: hash, inverse, program, value
  // Compiler value, before: lastHelper=value of last found helper, if any
  // On stack, after, if no lastHelper: same as [blockValue]
  // On stack, after, if lastHelper: value
  ambiguousBlockValue: function() {
    // We're being a bit cheeky and reusing the options value from the prior exec
    let blockHelperMissing = this.aliasable('helpers.blockHelperMissing'),
        params = [this.contextName(0)];
    this.setupHelperArgs('', 0, params, true);

    this.flushInline();

    let current = this.topStack();
    params.splice(1, 0, current);

    this.pushSource([
        'if (!', this.lastHelper, ') { ',
          current, ' = ', this.source.functionCall(blockHelperMissing, 'call', params),
        '}']);
  },

  // [appendContent]
  //
  // On stack, before: ...
  // On stack, after: ...
  //
  // Submits `content` to the queue for parsing as a HTML fragment.
  appendContent: function(content) {
    logOpCode('appendContent', arguments);
    if (this.pendingContent) {
      content = this.pendingContent + content;
    } else {
      this.pendingLocation = this.source.currentLocation;
    }

    this.pendingContent = content;
  },

  // [append]
  //
  // On stack, before: value, ... On stack, after: ...
  //
  // Delegate a generated expression to `c.appendResult()`.
  append: function() {
    logOpCode('append', arguments);

    let source = this.source.wrap(this.popStack());
    this.appendResult(source);
  },

  // [appendEscaped]
  //
  // On stack, before: value, ...
  // On stack, after: ...
  //
  // Escape `value` and append it to the buffer
  appendEscaped: function() {
    logOpCode('appendEscaped', arguments);
  
    this.pushSource(this.generateIdomCall(
      'text',
      [
        this.source.wrap(
          [
            this.aliasable('c.escapeExpression'), 
            '(', this.popStack(), ')'
          ]
        )
      ]
    ));
  },

  // [getContext]
  //
  // On stack, before: ...
  // On stack, after: ...
  // Compiler value, after: lastContext=depth
  //
  // Set the value of the `lastContext` compiler value to the depth
  getContext: function(depth) {
    logOpCode('getContext', arguments);

    this.lastContext = depth;
  },

  // [pushContext]
  //
  // On stack, before: ...
  // On stack, after: currentContext, ...
  //
  // Pushes the value of the current context onto the stack.
  pushContext: function() {
    logOpCode('pushContext', arguments);

    this.pushStackLiteral(this.contextName(this.lastContext));
  },

  // [lookupOnContext]
  //
  // On stack, before: ...
  // On stack, after: currentContext[name], ...
  //
  // Looks up the value of `name` on the current context and pushes
  // it onto the stack.
  lookupOnContext: function(parts, falsy, strict, scoped) {
    logOpCode('lookupOnContext', arguments);
    let i = 0;

    if (!scoped && this.options.compat && !this.lastContext) {
      // The depthed query is expected to handle the undefined logic for the root level that
      // is implemented below, so we evaluate that directly in compat mode
      this.push(this.depthedLookup(parts[i++]));
    } else {
      this.pushContext();
    }

    this.resolvePath('context', parts, i, falsy, strict);
  },

  // [lookupBlockParam]
  //
  // On stack, before: ...
  // On stack, after: blockParam[name], ...
  //
  // Looks up the value of `parts` on the given block param and pushes
  // it onto the stack.
  lookupBlockParam: function(blockParamId, parts) {
    logOpCode('lookupBlockParam', arguments);
    this.useBlockParams = true;

    this.push(['blockParams[', blockParamId[0], '][', blockParamId[1], ']']);
    this.resolvePath('context', parts, 1);
  },

  // [lookupData]
  //
  // On stack, before: ...
  // On stack, after: data, ...
  //
  // Push the data lookup operator
  lookupData: function(depth, parts, strict) {
    logOpCode('lookupData', arguments);

    if (!depth) {
      this.pushStackLiteral('data');
    } else {
      this.pushStackLiteral('c.data(data, ' + depth + ')');
    }

    this.resolvePath('data', parts, 0, true, strict);
  },

  resolvePath: function(type, parts, i, falsy, strict) {
    if (this.options.strict || this.options.assumeObjects) {
      this.push(strictLookup(this.options.strict && strict, this, parts, type));
      return;
    }

    let len = parts.length;
    for (; i < len; i++) {
      /* eslint-disable no-loop-func */
      this.replaceStack((current) => {
        let lookup = this.nameLookup(current, parts[i], type);
        // We want to ensure that zero and false are handled properly if the context (falsy flag)
        // needs to have the special handling for these values.
        if (!falsy) {
          return [' != null ? ', lookup, ' : ', current];
        } else {
          // Otherwise we can use generic falsy handling
          return [' && ', lookup];
        }
      });
      /* eslint-enable no-loop-func */
    }
  },

  // [resolvePossibleLambda]
  //
  // On stack, before: value, ...
  // On stack, after: resolved value, ...
  //
  // If the `value` is a lambda, replace it on the stack by
  // the return value of the lambda
  resolvePossibleLambda: function() {
    logOpCode('resolvePossibleLambda', arguments);
    this.push([this.aliasable('c.lambda'), '(', this.popStack(), ', ', this.contextName(0), ')']);
  },

  emptyHash: function(omitEmpty) {
    this.pushStackLiteral(omitEmpty ? 'undefined' : '{}');
  },
  pushHash: function() {
    if (this.hash) {
      this.hashes.push(this.hash);
    }
    this.hash = {values: {}};
  },
  popHash: function() {
    let hash = this.hash;
    this.hash = this.hashes.pop();

    this.push(this.objectLiteral(hash.values));
  },

  // [pushString]
  //
  // On stack, before: ...
  // On stack, after: quotedString(string), ...
  //
  // Push a quoted version of `string` onto the stack
  pushString: function(string) {
    logOpCode('pushString', arguments);
    this.pushStackLiteral(this.quotedString(string));
  },

  // [pushLiteral]
  //
  // On stack, before: ...
  // On stack, after: value, ...
  //
  // Pushes a value onto the stack. This operation prevents
  // the compiler from creating a temporary variable to hold
  // it.
  pushLiteral: function(value) {
    logOpCode('pushLiteral', arguments);
    this.pushStackLiteral(value);
  },

  // [pushProgram]
  //
  // On stack, before: ...
  // On stack, after: program(guid), ...
  //
  // Push a program expression onto the stack. This takes
  // a compile-time guid and converts it into a runtime-accessible
  // expression.
  pushProgram: function(guid) {
    if (guid != null) {
      this.pushStackLiteral(this.programExpression(guid));
    } else {
      this.pushStackLiteral(null);
    }
  },

  // [registerDecorator]
  //
  // On stack, before: hash, program, params..., ...
  // On stack, after: ...
  //
  // Pops off the decorator's parameters, invokes the decorator,
  // and inserts the decorator into the decorators list.
  registerDecorator(paramSize, name) {
    logOpCode('registerDecorator', arguments);
    let foundDecorator = this.nameLookup('decorators', name, 'decorator'),
        options = this.setupHelperArgs(name, paramSize);

    this.decorators.push([
      'fn = ',
      this.decorators.functionCall(foundDecorator, '', ['fn', 'props', 'container', options]),
      ' || fn;'
    ]);
  },

  // [invokeHelper]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of helper invocation
  //
  // Pops off the helper's parameters, invokes the helper,
  // and pushes the helper's return value onto the stack.
  //
  // If the helper is not found, `helperMissing` is called.
  invokeHelper: function(paramSize, name, isSimple) {
    logOpCode('invokeHelper', arguments);
    let nonHelper = this.popStack(),
        helper = this.setupHelper(paramSize, name),
        simple = isSimple ? [helper.name, ' || '] : '';

    let lookup = ['('].concat(simple, nonHelper);
    if (!this.options.strict) {
      lookup.push(' || ', this.aliasable('helpers.helperMissing'));
    }
    lookup.push(')');

    this.push(this.source.functionCall(lookup, 'call', helper.callParams));
  },

  // [invokeKnownHelper]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of helper invocation
  //
  // This operation is used when the helper is known to exist,
  // so a `helperMissing` fallback is not required.
  invokeKnownHelper: function(paramSize, name) {
    logOpCode('invokeKnownHelper', arguments);
    let helper = this.setupHelper(paramSize, name);

    let helperCall = this.source.functionCall(helper.name, 'call', helper.callParams);

    // Invoke incremental-dom thunk. N.b. helpers can return falsy values if they no-op.
    this.push(`(function () {\n var res = ${helperCall};\n if (res) res();\n})()`);
  },

  // [invokeAmbiguous]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of disambiguation
  //
  // This operation is used when an expression like `{{foo}}`
  // is provided, but we don't know at compile-time whether it
  // is a helper or a path.
  //
  // This operation emits more code than the other options,
  // and can be avoided by passing the `knownHelpers` and
  // `knownHelpersOnly` flags at compile-time.
  invokeAmbiguous: function(name, helperCall) {
    logOpCode('invokeAmbiguous', arguments);
    this.useRegister('helper');

    let nonHelper = this.popStack();

    this.emptyHash();
    let helper = this.setupHelper(0, name, helperCall);

    let helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

    let lookup = ['(', '(helper = ', helperName, ' || ', nonHelper, ')'];
    if (!this.options.strict) {
      lookup[0] = '(helper = ';
      lookup.push(
        ' != null ? helper : ',
        this.aliasable('helpers.helperMissing')
      );
    }

    this.push([
        '(', lookup,
        (helper.paramsInit ? ['),(', helper.paramsInit] : []), '),',
        '(typeof helper === ', this.aliasable('"function"'), ' ? ',
        this.source.functionCall('helper', 'call', helper.callParams), ' : helper))'
    ]);
  },

  // [invokePartial]
  //
  // On stack, before: context, ...
  // On stack after: result of partial invocation
  //
  // This operation pops off a context, invokes a partial with that context,
  // and pushes the result of the invocation back.
  invokePartial: function(isDynamic, name, indent) {
    logOpCode('invokePartial', arguments);
    let params = [],
        options = this.setupParams(name, 1, params);

    if (isDynamic) {
      name = this.popStack();
      delete options.name;
    }

    if (indent) {
      options.indent = JSON.stringify(indent);
    }
    options.helpers = 'helpers';
    options.partials = 'partials';
    options.decorators = 'c.decorators';

    if (!isDynamic) {
      params.unshift(this.nameLookup('partials', name, 'partial'));
    } else {
      params.unshift(name);
    }

    if (this.options.compat) {
      options.depths = 'depths';
    }
    options = this.objectLiteral(options);
    params.push(options);

    this.push(this.source.functionCall('c.invokePartial', '', params));
  },

  // [assignToHash]
  //
  // On stack, before: value, ..., hash, ...
  // On stack, after: ..., hash, ...
  //
  // Pops a value off the stack and assigns it to the current hash
  assignToHash: function(key) {
    logOpCode('assignToHash', arguments);
    this.hash.values[key] = this.popStack();
  },

  // HELPERS

  compiler: JavaScriptCompiler,

  compileChildren: function(environment, options) {
    let children = environment.children, child, compiler;

    for (let i = 0, l = children.length; i < l; i++) {
      child = children[i];
      compiler = new this.compiler(); // eslint-disable-line new-cap

      let existing = this.matchExistingProgram(child);

      if (existing == null) {
        this.context.programs.push(''); // Placeholder to prevent name conflicts for nested children
        let index = this.context.programs.length;
        child.index = index;
        child.name = 'program' + index;
        this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
        this.context.decorators[index] = compiler.decorators;
        this.context.environments[index] = child;

        this.useDepths = this.useDepths || compiler.useDepths;
        this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
        child.useDepths = this.useDepths;
        child.useBlockParams = this.useBlockParams;
      } else {
        child.index = existing.index;
        child.name = 'program' + existing.index;

        this.useDepths = this.useDepths || existing.useDepths;
        this.useBlockParams = this.useBlockParams || existing.useBlockParams;
      }
    }
  },
  matchExistingProgram: function(child) {
    for (let i = 0, len = this.context.environments.length; i < len; i++) {
      let environment = this.context.environments[i];
      if (environment && environment.equals(child)) {
        return environment;
      }
    }
  },

  programExpression: function(guid) {
    let child = this.environment.children[guid],
        programParams = [child.index, 'data', child.blockParams];

    if (this.useBlockParams || this.useDepths) {
      programParams.push('blockParams');
    }
    if (this.useDepths) {
      programParams.push('depths');
    }

    return 'c.program(' + programParams.join(', ') + ')';
  },

  useRegister: function(name) {
    if (!this.registers[name]) {
      this.registers[name] = true;
      this.registers.list.push(name);
    }
  },

  push: function(expr) {
    if (!(expr instanceof Literal)) {
      expr = this.source.wrap(expr);
    }

    this.inlineStack.push(expr);
    return expr;
  },

  pushStackLiteral: function(item) {
    this.push(new Literal(item));
  },

  pushTagContentSource: function(text) {
    this.source.push(this.generateIdomCall(
      'text',
      [
        this.source.wrap(
          [
            this.aliasable('c.escapeExpression'), 
            '(', this.quotedString(text), ')'
          ]
        )
      ]));
  },

  pushSource: function(source) {
    if (this.pendingContent) {
      if (this.isPartialTag) {
        let partialEndTag = parsePartialTagEnd(this.pendingContent);
        if (partialEndTag) {
          this.pushTagContentSource(partialEndTag.content);
          this.finalizePartialTag(this.partialTagName);
          this.isPartialTag = false;
          this.partialTagName = undefined;
          this.pushDOMSource(partialEndTag.remaining);
        } else {
          this.pushTagContentSource(this.pendingContent);
        }
      } else {
        this.pushDOMSource(this.pendingContent);
      }
      this.pendingContent = undefined;
    }

    if (source) {
      this.source.push(source);
    }
  },

  replaceStack: function(callback) {
    let prefix = ['('],
        stack,
        createdStack,
        usedLiteral;

    /* istanbul ignore next */
    if (!this.isInline()) {
      throw new Exception('replaceStack on non-inline');
    }

    // We want to merge the inline statement into the replacement statement via ','
    let top = this.popStack(true);

    if (top instanceof Literal) {
      // Literals do not need to be inlined
      stack = [top.value];
      prefix = ['(', stack];
      usedLiteral = true;
    } else {
      // Get or create the current stack name for use by the inline
      createdStack = true;
      let name = this.incrStack();

      prefix = ['((', this.push(name), ' = ', top, ')'];
      stack = this.topStack();
    }

    let item = callback.call(this, stack);

    if (!usedLiteral) {
      this.popStack();
    }
    if (createdStack) {
      this.stackSlot--;
    }
    this.push(prefix.concat(item, ')'));
  },

  incrStack: function() {
    this.stackSlot++;
    if (this.stackSlot > this.stackVars.length) { this.stackVars.push('stack' + this.stackSlot); }
    return this.topStackName();
  },
  topStackName: function() {
    return 'stack' + this.stackSlot;
  },
  flushInline: function() {
    let inlineStack = this.inlineStack;
    this.inlineStack = [];
    for (let i = 0, len = inlineStack.length; i < len; i++) {
      let entry = inlineStack[i];
      /* istanbul ignore if */
      if (entry instanceof Literal) {
        this.compileStack.push(entry);
      } else {
        let stack = this.incrStack();
        this.pushSource([stack, ' = ', entry, ';']);
        this.compileStack.push(stack);
      }
    }
  },
  isInline: function() {
    return this.inlineStack.length;
  },

  popStack: function(wrapped) {
    let inline = this.isInline(),
        item = (inline ? this.inlineStack : this.compileStack).pop();

    if (!wrapped && (item instanceof Literal)) {
      return item.value;
    } else {
      if (!inline) {
        /* istanbul ignore next */
        if (!this.stackSlot) {
          throw new Exception('Invalid stack pop');
        }
        this.stackSlot--;
      }
      return item;
    }
  },

  topStack: function() {
    let stack = (this.isInline() ? this.inlineStack : this.compileStack),
        item = stack[stack.length - 1];

    /* istanbul ignore if */
    if (item instanceof Literal) {
      return item.value;
    } else {
      return item;
    }
  },

  contextName: function(context) {
    if (this.useDepths && context) {
      return 'depths[' + context + ']';
    } else {
      return 'depth' + context;
    }
  },

  quotedString: function(str) {
    return this.source.quotedString(str);
  },

  objectLiteral: function(obj) {
    return this.source.objectLiteral(obj);
  },

  aliasable: function(name) {
    let ret = this.aliases[name];
    if (ret) {
      ret.referenceCount++;
      return ret;
    }

    ret = this.aliases[name] = this.source.wrap(name);
    ret.aliasable = true;
    ret.referenceCount = 1;

    return ret;
  },

  setupHelper: function(paramSize, name, blockHelper) {
    let params = [],
        paramsInit = this.setupHelperArgs(name, paramSize, params, blockHelper);
    let foundHelper = this.nameLookup('helpers', name, 'helper'),
        callContext = this.aliasable(`${this.contextName(0)} != null ? ${this.contextName(0)} : (c.nullContext || {})`);

    return {
      params: params,
      paramsInit: paramsInit,
      name: foundHelper,
      callParams: [callContext].concat(params)
    };
  },

  setupParams: function(helper, paramSize, params) {
    let options = {},
        objectArgs = !params,
        param;

    if (objectArgs) {
      params = [];
    }

    options.name = this.quotedString(helper);
    options.hash = this.popStack();

    let inverse = this.popStack(),
        program = this.popStack();

    // Avoid setting fn and inverse if neither are set. This allows
    // helpers to do a check for `if (options.fn)`
    if (program || inverse) {
      options.fn = program || 'c.noop';
      options.inverse = inverse || 'c.noop';
    }

    // The parameters go on to the stack in order (making sure that they are evaluated in order)
    // so we need to pop them off the stack in reverse order
    let i = paramSize;
    while (i--) {
      param = this.popStack();
      params[i] = param;
    }

    if (objectArgs) {
      options.args = this.source.generateArray(params);
    }

    if (this.options.data) {
      options.data = 'data';
    }
    if (this.useBlockParams) {
      options.blockParams = 'blockParams';
    }
    return options;
  },

  setupHelperArgs: function(helper, paramSize, params, useRegister) {
    let options = this.setupParams(helper, paramSize, params);
    options = this.objectLiteral(options);
    if (useRegister) {
      this.useRegister('options');
      params.push('options');
      return ['options=', options];
    } else if (params) {
      params.push(options);
      return '';
    } else {
      return options;
    }
  }
};


(function() {
  const reservedWords = (
    'break else new var' +
    ' case finally return void' +
    ' catch for switch while' +
    ' continue function this with' +
    ' default if throw' +
    ' delete in try' +
    ' do instanceof typeof' +
    ' abstract enum int short' +
    ' boolean export interface static' +
    ' byte extends long super' +
    ' char final native synchronized' +
    ' class float package throws' +
    ' const goto private transient' +
    ' debugger implements protected volatile' +
    ' double import public let yield await' +
    ' null true false'
  ).split(' ');

  const compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for (let i = 0, l = reservedWords.length; i < l; i++) {
    compilerWords[reservedWords[i]] = true;
  }
}());

JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
  return !JavaScriptCompiler.RESERVED_WORDS[name] && (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/).test(name);
};

function strictLookup(requireTerminal, compiler, parts, type) {
  let stack = compiler.popStack(),
      i = 0,
      len = parts.length;
  if (requireTerminal) {
    len--;
  }

  for (; i < len; i++) {
    stack = compiler.nameLookup(stack, parts[i], type);
  }

  if (requireTerminal) {
    return [compiler.aliasable('c.strict'), '(', stack, ', ', compiler.quotedString(parts[i]), ')'];
  } else {
    return stack;
  }
}

export default JavaScriptCompiler;
