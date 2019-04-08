import Handlebars from 'handlebars';

const HandlebarsIDOM = {};
for (const key in Handlebars) {
  HandlebarsIDOM[key] = Handlebars[key];
}

export default HandlebarsIDOM;
