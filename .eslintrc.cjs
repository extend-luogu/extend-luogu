module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    overrides: [
        {
            files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
            extends: [
                'eslint:recommended',
                'airbnb-base',
                'airbnb-typescript/base',
                'plugin:@typescript-eslint/recommended',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.eslint.json',
            },
            rules: {
                'semi-style': ['error', 'first'],
                quotes: [
                    'error',
                    'single',
                    { avoidEscape: true, allowTemplateLiterals: false },
                ],
                'no-underscore-dangle': 'off',
                'no-plusplus': 'off',
                'no-continue': 'off',
                'no-restricted-syntax': 'off',
                'no-multi-assign': 'off',
                'no-param-reassign': 'off',
                'guard-for-in': 'off',
                'no-return-assign': 'off',
                'consistent-return': 'off',
                'prefer-template': 'off',
                '@typescript-eslint/indent': [
                    'error', 4,
                    { ignoredNodes: ['TSTypeParameterInstantiation'] }
                ],
                '@typescript-eslint/semi': ['error', 'never'],
                '@typescript-eslint/naming-convention': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-use-before-define': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                '@typescript-eslint/brace-style': ['error', 'stroustrup']
            },
        },
        {
            files: ['*.config.*', '.*rc.*', '*.cjs'],
            env: {
                browser: false,
                node: true,
            },
            rules: {
                indent: ['error', 4],
                semi: ['error', 'never'],
                'import/no-extraneous-dependencies': [
                    'error',
                    { devDependencies: true },
                ],
            },
        },
    ],
};
