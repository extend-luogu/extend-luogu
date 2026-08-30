module.exports = {
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-empty-function': 'off',
  },
  overrides: [
    {
      files: ['features/*/*.ts'],
      rules: {
        'no-restricted-globals': ['error',
          'window', 'document', 'unsafeWindow', 'chrome', 'browser', 'WebSocket',
          'BroadcastChannel', 'fetch', 'jQuery', '_feInjection', '_feInstance', 'eval'],
        'no-restricted-imports': ['error', {
          paths: ['@exlg/runtime/internal', '@exlg/core'],
          patterns: ['@exlg/host-*', '**/src/core/**', '**/utils/**'],
        }],
      },
    },
    {
      files: ['packages/runtime/src/*.ts'],
      rules: {
        'no-restricted-globals': ['error',
          'window', 'document', 'unsafeWindow', 'chrome', 'browser', 'eval'],
      },
    },
    {
      files: ['packages/control-center/src/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-globals': ['error',
          'unsafeWindow', 'chrome', 'browser', 'WebSocket', 'BroadcastChannel', 'eval'],
        'no-restricted-imports': ['error', {
          paths: ['@exlg/runtime/internal', '@exlg/core'],
          patterns: ['@exlg/host-*', '@exlg/features', '**/features/**'],
        }],
      },
    },
  ],
}
