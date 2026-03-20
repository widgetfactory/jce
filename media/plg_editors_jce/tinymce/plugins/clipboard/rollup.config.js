import replace from '@rollup/plugin-replace';
import { eslint } from "rollup-plugin-eslint";

export default [
  {
    input: 'src/Plugin.js',

    output: {
      format: 'iife',
      file: "plugin.js",
      intro : '/* eslint-disable */'
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
