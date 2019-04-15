import basic from './examples/basic.json';
import nodeContent from './examples/node-content.json';
import builtins from './examples/builtins.json';
import escaping from './examples/escaping.json';
import partials from './examples/partials.json';
import attributes from './examples/attributes.json';
import { runIntegrationTests } from './integration-test-framework';

runIntegrationTests([
  basic,
  nodeContent,
  builtins,
  escaping,
  partials,
  attributes,
]);
