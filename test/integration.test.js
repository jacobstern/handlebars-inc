import nodeContent from './examples/node-content.json';
import builtins from './examples/builtins.json';
import { runIntegrationTests } from './integration-test-framework';

runIntegrationTests([nodeContent, builtins]);
