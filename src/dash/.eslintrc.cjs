module.exports = {
    root: true,
    parser: 'vue-eslint-parser',
    extends: [
        'plugin:vue/vue3-recommended',
        'eslint:recommended',
        '@vue/eslint-config-typescript/recommended',
    ],
    env: {
        'vue/setup-compiler-macros': true
    },
    rules: {
        'semi-style': ['error', 'first'],

        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/indent': [
            'error', 4,
            { ignoredNodes: ['TSTypeParameterInstantiation'] }
        ],
        '@typescript-eslint/semi': ['error', 'never'],

        'vue/html-indent': ['warn', 4],
        'vue/no-setup-props-destructure': 'off'
    }
}
