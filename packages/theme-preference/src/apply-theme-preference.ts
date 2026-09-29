import {
  type ColorScheme,
  isColorScheme,
  type ThemePreference
} from './theme-preference.ts'

/** Each tag names the scheme it colours: `<meta name="theme-color" data-scheme="dark">`. */
export const THEME_COLOR_SELECTOR = 'meta[name="theme-color"][data-scheme]'

/**
 * The `media` a `theme-color` tag of the given scheme must carry.
 *
 * A phone paints its address bar and task-switcher card from these tags. They
 * ship scoped to the system preference, so after an explicit choice the
 * browser chrome would keep the palette the page just left. `'system'` puts
 * the media query back rather than picking a colour.
 */
export const themeColorMediaFor = ({
  preference,
  scheme
}: {
  preference: ThemePreference
  scheme: ColorScheme
}): string => {
  if (preference === 'system') {
    return `(prefers-color-scheme: ${scheme})`
  }

  return scheme === preference ? 'all' : 'not all'
}

/**
 * Stamps `data-theme` on `<html>` for an explicit scheme, removes it for
 * `'system'` so the stylesheet's `prefers-color-scheme` rules answer, and
 * points every `theme-color` tag at the same palette.
 */
export const applyThemePreference = (preference: ThemePreference): void => {
  const root = document.documentElement

  if (preference === 'system') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = preference
  }

  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    THEME_COLOR_SELECTOR
  )) {
    const scheme = meta.dataset.scheme

    if (isColorScheme(scheme)) {
      meta.setAttribute('media', themeColorMediaFor({ preference, scheme }))
    }
  }
}
