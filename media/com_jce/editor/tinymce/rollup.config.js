/* eslint-disable */

import replace from '@rollup/plugin-replace';
import { eslint } from 'rollup-plugin-eslint';
/*import { uglify } from "rollup-plugin-uglify";*/

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
      banner: '/* eslint-disable */\n/* \n * This file includes original and modified code from various versions of Tinymce. \n * \n * Source: https://github.com/widgetfactory/tinymce-muon \n * Copyright (c) Tiny Technologies, Inc. All rights reserved. \n * Copyright (c) 1999-2015 Ephox Corp. All rights reserved. \n * Copyright, Moxiecode Systems AB. All rights reserved. \n * Copyright (c) 2009 - 2023 Ryan Demmer. All rights reserved. \n * For a detailed history of modifications, refer to the Git commit history. \n * Licensed under the GNU/LGPL 2.1 or later: http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html \n */'
    },

    plugins: [
      //uglify({ mangle: false }),
      replace({
        'tinymce$1': 'tinymce'
      }),
      eslint({
      })
    ]
  }
];