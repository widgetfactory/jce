export default [
  {
    input: 'src/Plugin.js',

    output: {
      format: 'iife',
      file: "plugin.js",
      intro : '/* eslint-disable */'
    },

    plugins: [ ]
  }
];