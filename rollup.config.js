import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/index.ts',
  output: {
    file: './lib/index.js',
    format: 'cjs'
  },
  plugins: [
    commonjs({
      namedExports: {
        'node_modules/lodash/lodash.js': [ 'uniqueId', 'union', 'includes', 'debounce' ]
      }
    }),
    resolve(),
    typescript()
  ],
  external: ['lodash', 'deepmerge', 'mobx']
}
