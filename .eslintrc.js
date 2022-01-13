module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['prettier'],

  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true
  },

  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    }
  }
};
