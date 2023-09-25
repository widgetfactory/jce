/* eslint-disable */

import replace from '@rollup/plugin-replace';
import {eslint} from 'rollup-plugin-eslint';

export default [
  {
    input: 'index.js',

    external: ['wfe'],

    output: {
      format: 'iife',
      file: "tinymce.js",
      globals: {
        wfe: 'wfe'
      },
      banner: '/* eslint-disable */'
    },

    plugins: [
      //uglify({mangle: false})
      replace({
        'tinymce$1': 'tinymce'
      }),
      eslint({
      })
    ]
  }


];