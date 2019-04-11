{
  desc: 'the compiler can insert dynamic content',
  examples: [
    {
      desc: 'in plain text',
      data: {
        name: 'Jake'
      },
      template: importstr './hbs/hello.hbs'
    },
    {
      desc: 'inside an element tag',
      data: {
        title: 'A Title'
      },
      template: importstr './hbs/element-content.hbs'
    },
    {
      desc: 'with nested tags',
      data: {
        firstName: 'Jake',
        lastName: 'Stern',
        content: 'Hello world!'
      },
      template: importstr './hbs/nested-tags.hbs'
    }
  ]
}
