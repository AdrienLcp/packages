import { prePaintScriptFor } from './pre-paint-script.ts'

/** The slice of Vite's `Plugin` this uses, so the package needs no Vite dependency. */
export type ThemePreferenceVitePlugin = {
  name: string
  transformIndexHtml: () => {
    children: string
    injectTo: 'head'
    tag: 'script'
  }[]
}

/**
 * Appends the pre-paint script to the `<head>` of every page Vite serves or
 * builds, after the `theme-color` tags. Pass the store itself so the key lives
 * in one place.
 */
export const themePreferencePlugin = ({
  storageKey
}: {
  storageKey: string
}): ThemePreferenceVitePlugin => ({
  name: '@adrienlcp/theme-preference',
  transformIndexHtml: () => [
    { children: prePaintScriptFor(storageKey), injectTo: 'head', tag: 'script' }
  ]
})
