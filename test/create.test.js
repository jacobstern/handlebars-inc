/**
 * @jest-environment jsdom
 */

import HandlebarsInc from '../lib';
import runtime from '../lib/runtime';

test('can create an instance of HandlebarsInc and compile a template', () => {
  const instance = HandlebarsInc.create();
  const template = instance.compile('<div>Hello {{name}}!</div>');
  const container = document.createElement('div');
  instance.patch(container, template({ name: 'Jake' }, { backend: 'idom' }));
  expect(container.innerHTML).toBe('<div>Hello Jake!</div>');
});

test('can create an instance of the runtime library execute a template', () => {
  const template = HandlebarsInc.compile('<div>Hello {{name}}!</div>');
  const container = document.createElement('div');
  const instance = runtime.create();
  instance.patch(container, template({ name: 'Jake' }, { backend: 'idom' }));
  expect(container.innerHTML).toBe('<div>Hello Jake!</div>');
});
