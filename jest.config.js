// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  modulePathIgnorePatterns: [
    'vendor/handlebars.js/components/',
    'vendor/handlebars.js/dist/',
  ],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/', 'vendor/'],

  watchPlugins: ['./test/jsonnet-watch-plugin', './test/webpack-watch-plugin'],
};
