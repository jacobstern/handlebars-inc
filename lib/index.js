import hbs from 'handlebars';

const handlebarsIdom = {};
for (const key in hbs) {
  handlebarsIdom[key] = hbs[key];
}

export default handlebarsIdom;
