import handlebarsIdom from '../lib';
import { readFileRelative } from './test-utils';

test('can compile a file', async () => {
  const hbs = await readFileRelative('./example/simple.hbs');
  const template = handlebarsIdom.compile(hbs);
  expect(typeof template).toBe('function');
});
