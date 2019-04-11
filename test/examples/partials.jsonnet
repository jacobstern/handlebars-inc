{
  desc: 'the compiler can insert dynamic content',
  examples: [
    {
      desc: 'In a simple text template',
      data: {
        name: 'Jake',
      },
      template: importstr './hbs/hello-partial.hbs',
      partials: {
        hello: importstr './hbs/hello.hbs',
      },
      expected: |||
        Here's a partial: Hello Jake!
      |||,
    },
  ],
}
