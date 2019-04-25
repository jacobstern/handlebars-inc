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
  options.idom.elementOpen('a', options.uniqueKey, [], 'href', url);
  options.idom.text(text);
  options.idom.elementClose('a');
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

test('can execute a custom helper multiple times with different arguments', () => {
  const instance = handlebars.create();
  instance.registerHelper('link', link);
  const template = instance.compile(`<li>{{ link stories.0.text stories.0.url }}</li>
<li>{{ link stories.1.text stories.1.url }}</li>`);
  const result = template({
    stories: [
      {
        text: 'childNodes',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes',
      },
      {
        text: 'cloneNode',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode',
      },
    ],
  });
  expect(result)
    .toBe(`<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes">childNodes</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode">cloneNode</a></li>`);
});

test('can compile with knownHelpers', () => {
  const instance = handlebars.create();
  instance.registerHelper('link', link);
  const template = instance.compile('{{ link story.text story.url }}', {
    knownHelpers: { link: true },
    knownHelpersOnly: true,
  });
  const result = template({
    story: { text: 'About Phoenix LiveView', url: 'http://...' },
  });
  expect(result).toBe('<a href="http://...">About Phoenix LiveView</a>');
});
