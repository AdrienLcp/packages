# @adrienlcp/theme-preference

Light, dark or system theme: no flash of the wrong palette on load, and a
browser toolbar that follows the choice. No third-party dependency: storage goes
through [`@adrienlcp/safe-storage`](https://github.com/AdrienLcp/packages/tree/main/packages/safe-storage).

The detail most theme switchers miss: a phone paints its address bar from
`<meta name="theme-color">`. Those tags ship scoped to
`prefers-color-scheme`, so a visitor who picks dark on a light system keeps a
light toolbar over a dark page. This package switches each tag's `media`
between `all`, `not all` and the media query, both before the first paint and
live.

```bash
pnpm add @adrienlcp/theme-preference
```

## The markup

One `theme-color` tag per scheme, each saying which scheme it colours:

```html
<meta name="theme-color" data-scheme="light" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" data-scheme="dark" content="#101010" media="(prefers-color-scheme: dark)" />
```

The stylesheet follows the system by default and yields to `data-theme`. The
package ships it: import `@adrienlcp/theme-preference/color-scheme.css` once
(or `@use` it from Sass), and write every colour token as
`light-dark(<light>, <dark>)`:

```css
:root { color-scheme: light dark; }
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
```

The file is unlayered, so it wins over any `color-scheme` a layered stylesheet
sets.

A value `light-dark()` cannot carry — a percentage, a length, a shadow's
geometry — goes through the `scheme` Sass mixins, which follow the same
precedence: the system preference, unless `data-theme` says otherwise.

```sass
@use '@adrienlcp/theme-preference/scheme'

@layer tokens
  @include scheme.dark
    --tint-strength: 38%
```

`scheme.light` is the mirror, for an app whose defaults are the dark values.

## The store

```ts
// theme.ts
import { createThemePreferenceStore } from '@adrienlcp/theme-preference'

export const themeStore = createThemePreferenceStore({ storageKey: 'app:theme' })
```

`getPreference()`, `setPreference(preference)` and `subscribe(listener)`.
`setPreference` persists the choice, stamps the document and notifies every
subscriber. A preference is `'system' | 'light' | 'dark'`; `'system'` is stored
as no entry at all. Storage that throws, as in a Safari private window, reads as
`'system'` and keeps a new choice for the current page view.

## Before the first paint

The pre-paint script must run in `<head>`, after the `theme-color` tags. With
Vite, the plugin appends it to every page, reading the key from the store:

```ts
// vite.config.ts
import { themePreferencePlugin } from '@adrienlcp/theme-preference/vite'

import { themeStore } from './src/theme'

export default defineConfig({ plugins: [themePreferencePlugin(themeStore)] })
```

Without Vite, inline `themeStore.prePaintScript` (or
`prePaintScriptFor(key)`) yourself.

## React

```tsx
import { useThemePreference } from '@adrienlcp/theme-preference/react'

const ThemeSwitch = () => {
  const { preference, setPreference } = useThemePreference(themeStore)
  // …
}
```

Every component using the hook re-renders on a change. A server render reads
`'system'`.
