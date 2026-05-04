import replace from '@rollup/plugin-replace';

export default [
    {
        input: 'src/Plugin.js',

        output: {
            format: 'iife',
            file: 'plugin.js',
            intro: '/* eslint-disable */'
        },

        plugins: [
            replace({
                'tinymce$1': 'tinymce',
                preventAssignment: true
            })
        ]
    }
];
