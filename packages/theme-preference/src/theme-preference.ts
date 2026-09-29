export const COLOR_SCHEMES = ['light', 'dark'] as const

/** A palette the page can be painted in. */
export type ColorScheme = (typeof COLOR_SCHEMES)[number]

export const THEME_PREFERENCES = ['system', ...COLOR_SCHEMES] as const

/**
 * What the visitor chose. `'system'` follows `prefers-color-scheme`: it is a
 * choice of its own, not the absence of one.
 */
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const isColorScheme = (value: unknown): value is ColorScheme =>
  COLOR_SCHEMES.some((scheme) => scheme === value)

export const isThemePreference = (value: unknown): value is ThemePreference =>
  THEME_PREFERENCES.some((preference) => preference === value)
