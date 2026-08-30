import { defineConfig } from 'vitest/config'
import { aliases } from './vite.aliases'

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx', 'features/**/*.test.ts'],
  },
})
