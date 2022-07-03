module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        'eslint:recommended',
        'airbnb-base',
        'plugin:prettier/recommended'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    overrides: [
        {
            files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
            extends: [
                'eslint:recommended',
                'airbnb-base',
                'airbnb-typescript/base',
                'plugin:@typescript-eslint/recommended',
                'plugin:prettier/recommended'
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.eslint.json'
            },
            rules: {
                quotes: [
                    'error',
                    'single',
                    { avoidEscape: true, allowTemplateLiterals: false }
                ],
                'no-underscore-dangle': 'off',
                'no-plusplus': 'off',
                'no-restricted-syntax': 'off',
                'no-multi-assign': 'off',
                'no-param-reassign': 'off',
                'guard-for-in': 'off',
                'no-return-assign': 'off',
                'consistent-return': 'off',
                '@typescript-eslint/naming-convention': 'off',
                '@typescript-eslint/no-use-before-define': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off'
            }
        },
        {
            files: ['*.config.*', '.*rc.*', '*.cjs'],
            env: {
                browser: false,
                node: true
            },
            rules: {
                'import/no-extraneous-dependencies': [
                    'error',
                    { devDependencies: true }
                ]
            }
        }
    ]
}
