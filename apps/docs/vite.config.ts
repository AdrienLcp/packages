import { resolve } from 'node:path'

import { shellHead } from '@adrienlcp/prerender/vite'
import { metricTwins } from '@adrienlcp/styles/metric-twins'
import { themePreferencePlugin } from '@adrienlcp/theme-preference/vite'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import fontaine from 'fontaine/postcss'
import { defineConfig } from 'vite'

import { cataloguePlugin } from './src/features/packages/catalogue-plugin.ts'
import { i18n } from './src/presentation/i18n/i18n.ts'
import { REGIONAL_LOCALES } from './src/presentation/i18n/regional-locales.ts'
import { themeStore } from './src/presentation/theme/theme-store.ts'

/** Written by `fonts.fallback-faces` in `_fonts.sass`, one face per weight band. */
const FALLBACK_FACES_WRITTEN_PER_WEIGHT_BAND = 'Onest fallback'

const translateEnglish = i18n.translator('en')

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
            resolve(import.meta.dirname, 'public', `.${path}`),
          skipFontFaceGeneration: (fallbackName) =>
            fallbackName === FALLBACK_FACES_WRITTEN_PER_WEIGHT_BAND
        }),
        metricTwins()
      ]
    }
  },
  plugins: [
    shellHead({
      filename: resolve(import.meta.dirname, 'index.html'),
      metaContents: {
        'name="description"': translateEnglish('app.description'),
        'property="og:description"': translateEnglish('app.description'),
        'property="og:title"': translateEnglish('app.name')
      },
      title: translateEnglish('app.name')
    }),
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
