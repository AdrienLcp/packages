export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

/** Each language named in itself, whatever language the page is in. */
export const LOCALE_NAMES = {
  en: 'English',
  fr: 'Français'
} as const satisfies Record<Locale, string>

export const DEFAULT_LOCALE = 'en' satisfies Locale

export const isLocale = (value: string): value is Locale =>
  LOCALES.some((locale) => locale === value)
