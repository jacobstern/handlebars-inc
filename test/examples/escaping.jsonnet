{
  desc: 'the compiler properly handles escaped and unescaped constructs',
  examples: [
    {
      desc: 'such as an unescaped string when using the text backend',
      template: importstr './hbs/unescaped.hbs',
      data: {
        content: '<h1>My Post</h1>',
      },
      modes: ['text'],
    },
  ],
}
