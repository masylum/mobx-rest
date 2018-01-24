module.exports = {
  parser: 'babel-eslint',
  plugins: [ 'flowtype' ],

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

  extends: [
    'plugin:flowtype/recommended',
    'standard'
  ],

  rules: {
    'object-curly-spacing': ['warn', 'always'],
    'prefer-promise-reject-errors': 'off',
    'no-duplicate-imports': 'off',
    'flowtype/no-weak-types': [0, {
      'any': false,
      'Object': false,
      'Function': false
    }]
  }
};

