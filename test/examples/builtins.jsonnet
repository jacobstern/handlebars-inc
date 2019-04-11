{
  desc: 'the compiler implements built-in helpers properly',
  examples: [
    {
      desc: 'with a basic usage of each',
      data: {
        title: 'Hello world!',
        comments: [
          {
            subject: 'Nice job',
            body: 'This is a good post.'
          },
          {
            subject: 'Minor correction',
            body: ''
          }
        ]
      },
      file: 'each.hbs'
    },
    {
      desc: 'with an if block helper that matches',
      data: {
        author: true,
        firstName: 'Sam',
        lastName: 'Seder'
      },
      file: 'if.hbs'
    },
    {
      desc: 'with an if block helper that does not match',
      data: {
        author: false
      },
      file: 'if.hbs'
    },
    {
      desc: 'with an if/else block helper that matches',
      data: {
        author: true,
        firstName: 'Sam',
        lastName: 'Seder'
      },
      file: 'if-else.hbs'
    },
    {
      desc: 'with an if/else block helper that does not match',
      data: {
        author: false
      },
      file: 'if-else.hbs'
    },
    {
      desc: 'with an unless block helper that matches',
      data: {
        license: null
      },
      file: 'unless.hbs'
    },
    {
      desc: "with an unless block helper that doesn't match",
      data: {
        license: 'MIT'
      },
      file: 'unless.hbs',
      expected: |||
        <div class='entry'>
        </div>
      |||
    },
    {
      desc: "with an each block helper that doesn't match",
      data: {
        title: 'Hello world!',
        comments: []
      },
      file: 'each-else.hbs',
      expected: |||
        Hello world!
        <div>No comments.</div>
      |||
    },
    {
      desc: 'with an each block helper that uses this',
      data: { people: ['Yehuda Katz', 'Alan Johnson', 'Charles Jolley'] },
      file: 'each-this.hbs'
    },
    {
      desc: 'with an each block helper that uses @index',
      data: { 'people': ['Yehuda Katz', 'Alan Johnson', 'Charles Jolley'] },
      file: 'each-index.hbs'
    },
    {
      desc: 'with a with block helper',
      data: {
        title: 'My first post!',
        author: {
          firstName: 'Charles',
          lastName: 'Jolley'
        }
      },
      file: 'with.hbs'
    }
  ]
}
