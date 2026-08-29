import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@exlg/runtime': fileURLToPath(new URL('./packages/runtime/src/index.ts', import.meta.url)),
      '@exlg/runtime/internal': fileURLToPath(new URL('./packages/runtime/src/internal.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts'],
  },
})
