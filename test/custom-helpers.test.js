import handlebars from '../lib';

function capitalize(value) {
  return value.toUpperCase();
}

test('can execute a helper that just returns text', () => {
  const instance = handlebars.create();
  instance.registerHelper('capitalize', capitalize);
  const template = instance.compile('<div>{{ capitalize "hello" }}</div>');
  const result = template();
  expect(result).toBe('<div>HELLO</div>');
});

function link(text, url, options) {
  return function() {
    options.idom.elementOpen('a', options.uniqueKey, [], 'href', url);
    options.idom.text(text);
    options.idom.elementClose('a');
  };
}

test('can execute a helper that produces incremental-dom operatins', () => {
  const instance = handlebars.create();
  instance.registerHelper('link', link);
  const template = instance.compile('{{ link story.text story.url }}');
  const result = template({
    story: { text: 'About Phoenix LiveView', url: 'http://...' },
  });
  expect(result).toBe('<a href="http://...">About Phoenix LiveView</a>');
});
