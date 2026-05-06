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
                'ibis$1': 'ibis',
                preventAssignment: true
            })
        ]
    }
];
