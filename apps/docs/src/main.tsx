import { createRoot } from 'react-dom/client'

import { routerReadyToReplacePrerender } from '@/infrastructure/router/browser-router'
import { App } from '@/presentation/app'
import { applyInitialLocale } from '@/presentation/i18n/initial-locale'

import '@/presentation/styles/globals.sass'

const locale = applyInitialLocale()

const container = document.getElementById('root')

if (container === null) {
  throw new Error('Missing #root in index.html')
}

if (container.hasChildNodes()) {
  await routerReadyToReplacePrerender()
}

/**
 * `createRoot` over the prerendered markup rather than `hydrateRoot`: the
 * document cannot know this device's theme, and hydrating would either
 * mismatch on every load or push the theme into an effect, which is a flash.
 */
createRoot(container).render(<App locale={locale} />)
