{
  desc: 'the compiler handles dynamic attribute values',
  examples: [
    {
      desc: 'with values from the context',
      data: {
        class: 'button',
        type: 'submit',
        content: 'Hello button!',
      },
      template: importstr './hbs/attrs-from-context.hbs',
      backends: ['text'],
    },
    {
      desc: 'using matching #if to set attributes',
      data: {
        isLoading: true,
      },
      template: importstr './hbs/attrs-if.hbs',
    },
    {
      desc: 'using a negative #if to set attributes',
      data: {
        isLoading: false,
      },
      template: importstr './hbs/attrs-if.hbs',
    },
    {
      desc: 'such as a more complicated example with attributes and nested tags',
      data: {
        isLoading: true,
      },
      template: importstr './hbs/attrs-nested-tags.hbs',
    },
    {
      desc: 'setting attributes on a self-closing tag',
      data: {
        query: 'Vietnam',
      },
      template: importstr './hbs/attrs-self-closing.hbs',
    },
  ],
}
