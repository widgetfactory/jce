export default [
  {
    input: 'src/core.js',

    output: {
      format: 'iife',
      file: "core.min.js",
      intro : '/* eslint-disable */'
      //banner: '(function(){',
      //footer: '})();'
    },

    plugins: [
    ]
  },
  {
    input: 'src/profile.js',

    output: {
      format: 'iife',
      file: "profile.min.js",
      intro : '/* eslint-disable */'
      //banner: '(function(){',
      //footer: '})();'
    },

    plugins: [
    ]
  }
];