import type { Plugin } from 'vite'

import { prePaintScriptFor } from './pre-paint-script.ts'

/**
 * Appends the pre-paint script to the `<head>` of every page Vite serves or
 * builds, after the `theme-color` tags. Pass the store itself so the key lives
 * in one place.
 */
export const themePreferencePlugin = ({
  storageKey
}: {
  storageKey: string
}): Plugin => ({
  name: '@adrienlcp/theme-preference',
  transformIndexHtml: () => [
    { children: prePaintScriptFor(storageKey), injectTo: 'head', tag: 'script' }
  ]
})
