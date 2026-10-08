import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

import { cataloguePlugin } from './src/features/packages/catalogue-plugin.ts'

export default defineConfig({
  plugins: [
    cataloguePlugin({ repositoryRoot: resolve(import.meta.dirname, '../..') })
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src')
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
