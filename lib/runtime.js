import * as base from './handlebars-inc/vendor/handlebars/base';

import SafeString from './handlebars-inc/vendor/handlebars/safe-string';
import Exception from './handlebars-inc/vendor/handlebars/exception';
import * as Utils from './handlebars-inc/vendor/handlebars/utils';
import { escapeExpression } from './handlebars-inc/vendor/handlebars/utils';

// Forked runtime
import * as runtime from './handlebars-inc/runtime';
import { registerHelperOverrides } from './handlebars-inc/helpers';

/* globals require */

let defaultIdom = null;
if (typeof window !== 'undefined') {
  // Only load incremental-dom in a browser environment
  defaultIdom = require('incremental-dom');
}

export function getDefaultIdom() {
  return defaultIdom;
}

function create() {
  const hb = new base.HandlebarsEnvironment();
  Utils.extend(hb, base);

  hb.SafeString = SafeString;
  hb.Exception = Exception;
  hb.Utils = Utils;
  hb.escapeExpression = escapeExpression;

  hb.VM = runtime;
  hb.template = function(spec) {
    return runtime.template(spec, hb);
  };

  hb.idom = getDefaultIdom();
  hb.patch = function(element, thunk, data) {
    return hb.idom.patch(element, thunk, data);
  };

  registerHelperOverrides(hb);

  return hb;
}

const inst = create();
inst.create = create;

const {
  helpers,
  partials,
  decorators,
  logger,
  log,
  registerHelper,
  unregisterHelper,
  registerPartial,
  unregisterPartial,
  registerDecorator,
  unregisterDecorator,
  VM,
  template,
  idom,
  patch,
} = inst;

export {
  helpers,
  partials,
  decorators,
  logger,
  log,
  registerHelper,
  unregisterHelper,
  registerPartial,
  unregisterPartial,
  registerDecorator,
  unregisterDecorator,
  SafeString,
  Exception,
  Utils,
  escapeExpression,
  VM,
  template,
  idom,
  patch,
};

export default inst;
