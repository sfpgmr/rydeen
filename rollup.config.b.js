// rollup.config.js

import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
  {
    input: 'src/js/browser/index.js',
    output: {
      file: 'dist/browser/index.js',
      format: 'iife'
    },
    plugins: [
      nodeResolve({ jsnext: true }),
      commonjs()
    ],
    external:[
      'sharp','electron','events'
    ]  
  }
];
