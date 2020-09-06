// rollup.config.js

import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
  input: 'src/js/electron/index.mjs',
  output: {
    file: 'dist/electron/index.js',
    format: 'cjs'
  },
  plugins: [
    nodeResolve({ jsnext: true }),
    commonjs()
  ],
  external:[
    'sharp','electron','events','tween',
  ]  
},
{
  input: 'src/js/electron/main.mjs',
  output: {
    file: 'dist/electron/main.js',
    format: 'cjs'
  },
  plugins: [
    nodeResolve({ jsnext: true }),
    commonjs()
  ],
  external:[
    'sharp','electron','events','tween',
  ]  
}
];
