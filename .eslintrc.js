module.exports = {
  plugins: ['jest'],
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    'jest/globals': true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 11,
  },
  globals: { process: true },
  rules: {},
};
