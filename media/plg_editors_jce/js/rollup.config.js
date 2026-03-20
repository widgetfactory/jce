/* eslint-disable */
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { eslint } from 'rollup-plugin-eslint';
/*import { uglify } from "rollup-plugin-uglify";*/

export default [
  {
    input: 'lib/editor/Main.js',

    output: {
      format: 'iife',
      file: "editor.min.js",
      banner: '/**\n * @package \tJCE\n * @copyright \tCopyright (c) 2009-2026 Ryan Demmer. All rights reserved.\n * @license \tGNU/GPL 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html\n * JCE is free software. This version may have been modified pursuant\n * to the GNU General Public License, and as distributed it includes or\n * is derivative of works licensed under the GNU General Public License or\n * other free or open source software licenses.\n */'
    },

    plugins: [
      replace(),
      resolve(),
      commonjs()
    ]
  },

  {
    input: 'lib/plugin.js',

    output: {
      format: 'iife',
      file: "plugin.min.js",
      globals: {
        wfe: 'wfe'
      },
      banner: ''
    },

    plugins: [
      //uglify({ mangle: false }),
      replace(),
      resolve(),
      commonjs()
    ]
  },

  {
    input: 'lib/filebrowser.js',

    output: {
      format: 'iife',
      file: "filebrowser.min.js",
      globals: {
        wfe: 'wfe'
      },
      banner: ''
    },

    plugins: [
      //uglify({ mangle: false }),
      replace(),
      resolve(),
      commonjs()
    ]
  }
];