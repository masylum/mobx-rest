import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import dts from 'rollup-plugin-dts';

export default [
	{
		input: './src/index.ts',
		output: {
			file: './lib/index.js',
			format: 'cjs'
		},
		plugins: [
			resolve(),
			typescript({
				tsconfigOverride: {
					compilerOptions: {
						declaration: false
					}
				}
			})
		],
		external: [
			'lodash/compact',
			'lodash/debounce',
			'lodash/difference',
			'lodash/includes',
			'lodash/isEqual',
			'lodash/isObject',
			'lodash/isPlainObject',
			'lodash/union',
			'lodash/uniqueId',
			'lodash/intersection',
			'deepmerge',
			'mobx'
		]
	},
	{
		// Generate bundled declaration file
		input: './src/index.ts',
		output: [ { file: './lib/index.d.ts', format: 'es' } ],
		plugins: [ dts() ]
	}
];
