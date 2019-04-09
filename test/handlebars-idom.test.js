import HandlebarsIDOM from '../lib';
import { readTestLocalFile } from './integration-test-framework';

test('can compile a file', () => {
  let hbs = readTestLocalFile('hbs/if.hbs');
  let template = HandlebarsIDOM.compile(hbs, { idom: true });
  expect(typeof template).toBe('function');
});
