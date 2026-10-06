import { resolve } from 'node:path'

import { themePreferencePlugin } from '@adrienlcp/theme-preference/vite'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import fontaine from 'fontaine/postcss'
import { defineConfig } from 'vite'

import { cataloguePlugin } from './src/features/packages/catalogue-plugin.ts'
import { REGIONAL_LOCALES } from './src/presentation/i18n/regional-locales.ts'
import { themeStore } from './src/presentation/theme/theme-store.ts'

export default defineConfig({
  build: {
    manifest: true,
    sourcemap: true
  },
  css: {
    postcss: {
      plugins: [
        fontaine({
          fallbacks: {},
          resolvePath: (path) =>
            resolve(import.meta.dirname, 'public', `.${path}`)
        })
      ]
    }
  },
  plugins: [
    cataloguePlugin({ repositoryRoot: resolve(import.meta.dirname, '../..') }),
    themePreferencePlugin(themeStore),
    react({ compiler: { logDiagnostics: true } }),
    {
      ...optimizeLocales.vite({ locales: Object.values(REGIONAL_LOCALES) }),
      enforce: 'pre'
    }
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src')
    }
  },
  server: {
    port: 5374,
    strictPort: true
  }
})
