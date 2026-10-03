import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/*.test.ts', '**/*.fixture.ts'],
      include: ['packages/*/src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { branches: 95, functions: 90, lines: 95, statements: 95 }
    },
    projects: ['apps/*/vitest.config.ts', 'packages/*/vitest.config.ts']
  }
})
