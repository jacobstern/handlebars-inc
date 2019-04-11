import basic from './examples/basic.json';
import nodeContent from './examples/node-content.json';
import builtins from './examples/builtins.json';
import partials from './examples/partials.json';
import { runIntegrationTests } from './integration-test-framework';

runIntegrationTests([basic, nodeContent, builtins, partials]);
