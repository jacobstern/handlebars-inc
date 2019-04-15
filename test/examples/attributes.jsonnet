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
      test: 'skip',
    },
    {
      desc: 'using matching #if to set attributes',
      data: {
        isLoading: true,
      },
      template: importstr './hbs/attrs-if.hbs',
      backends: ['text'],
    },
    {
      desc: 'using a negative #if to set attributes',
      data: {
        isLoading: false,
      },
      template: importstr './hbs/attrs-if.hbs',
      test: 'skip',
    },
  ],
}
