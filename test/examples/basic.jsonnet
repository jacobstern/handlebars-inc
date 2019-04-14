{
  desc: 'the compiler can generate common HTML constructs',
  examples: [
    {
      desc: 'such as multiple attributes on an <input> tag',
      template: importstr './hbs/input-attrs.hbs',
    },
    {
      desc: 'such as a basic input element in a search page',
      template: importstr './hbs/bulma-search.hbs',
    },
  ],
}
