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
    {
      desc: 'with nested templates',
      data: {
        comments: [
          {
            subject: 'Nice job',
            body: 'This is a good post.',
          },
          {
            subject: 'Minor correction',
            body: '',
          },
        ],
      },
      partials: {
        comment: importstr './hbs/comment.hbs',
        commentsList: importstr './hbs/comments-list.hbs',
      },
      template: importstr './hbs/comments-section.hbs',
    },
  ],
}
