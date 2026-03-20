const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        files: ['src/**/*.js', 'tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'commonjs',
            globals: {
                afterEach: 'readonly',
                beforeEach: 'readonly',
                console: 'readonly',
                describe: 'readonly',
                expect: 'readonly',
                process: 'readonly',
                test: 'readonly',
            },
        },
        rules: {},
    },
];
