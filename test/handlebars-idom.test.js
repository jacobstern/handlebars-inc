import HandlebarsIDOM from '../lib';
import { getHbsSource } from './test-core';

test('can compile a file', () => {
  let hbs = getHbsSource('if');
  let template = HandlebarsIDOM.compile(hbs);
  expect(typeof template).toBe('function');
});
