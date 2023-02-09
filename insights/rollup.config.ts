import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'
import includePaths from 'rollup-plugin-includepaths'
import { eslint } from 'rollup-plugin-eslint'

let includePathOptions = {
    path: ['src'],
    extentions: ['.ts'],
};

export default {
    input: 'src/index.ts',
    external: ['@vodacom/web-events'],
    output: {
        file: 'lib/index.ts',
        format: 'cjs',
    },
    plugins: [
        includePaths(includePathOptions),
        balel(),
        resolve(),
        commonjs(),
        eslint(),
    ],
};