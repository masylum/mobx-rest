module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: [ '@typescript-eslint' ],

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
  },

  rules: {
    'object-curly-spacing': ['warn', 'always'],
    'prefer-promise-reject-errors': 'off',
    'no-duplicate-imports': 'off'
  }
};

