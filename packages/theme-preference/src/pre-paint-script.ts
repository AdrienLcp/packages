import { THEME_COLOR_SELECTOR } from './apply-theme-preference.ts'

/**
 * The inline script that applies a stored explicit scheme before the first
 * paint, so the page never flashes the system palette first. It must run in
 * `<head>` after the `theme-color` tags, which it reads as they are parsed.
 *
 * It writes the same DOM as `applyThemePreference`, which the test suite
 * holds it to. `'system'` has nothing to do here: the markup already follows
 * the system.
 */
export const prePaintScriptFor = (storageKey: string): string =>
  [
    'try{',
    `const t=localStorage.getItem(${JSON.stringify(storageKey)});`,
    'if(t==="light"||t==="dark"){',
    'document.documentElement.dataset.theme=t;',
    `for(const m of document.querySelectorAll(${JSON.stringify(THEME_COLOR_SELECTOR)}))`,
    'if(m.dataset.scheme==="light"||m.dataset.scheme==="dark")',
    'm.setAttribute("media",m.dataset.scheme===t?"all":"not all")',
    '}}catch{}'
  ].join('')
