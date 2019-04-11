{
  desc: 'the compiler can generate common HTML constructs, such as',
  examples: [
    {
      desc: 'multiple attributes on an <input> tag',
      template: importstr './hbs/input-attrs.hbs',
      expected: |||
        <input type="text" placeholder="Name"></input>
      |||,
    },
  ],
}
