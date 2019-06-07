import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/index.ts',
  output: {
    file: './lib/index.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    typescript()
  ],
  external: [
    'lodash/debounce',
    'lodash/difference',
    'lodash/includes',
    'lodash/isEqual',
    'lodash/isMatch',
    'lodash/isObject',
    'lodash/isPlainObject',
    'lodash/union',
    'lodash/uniqueId',
    'deepmerge',
    'mobx'
  ]
}
