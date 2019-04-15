{
  desc: 'the compiler properly handles escaped and unescaped constructs, such as',
  examples: [
    {
      desc: 'an unescaped HTML string when using the text backend',
      template: importstr './hbs/unescaped.hbs',
      data: {
        content: '<h1>My Post</h1>',
      },
      backends: ['text'],
    },
    {
      desc: 'element content with HTML-escaped characters',
      template: importstr './hbs/element-content.hbs',
      data: {
        title: 'Peace and Love <3',
      },
    },
    {
      desc: 'an element with HTML-escaped characters in a partial',
      template: importstr './hbs/nested-title.hbs',
      data: {
        title: 'Peace and Love <3',
      },
      partials: {
        title: importstr './hbs/element-content.hbs',
      },
    },
  ],
}
