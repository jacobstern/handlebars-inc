import HandlebarsIDOM from '../lib';
import { getHbsSource } from './integration-test-framework';

test('can compile a file', () => {
  let hbs = getHbsSource('if');
  let template = HandlebarsIDOM.compile(hbs);
  expect(typeof template).toBe('function');
});
