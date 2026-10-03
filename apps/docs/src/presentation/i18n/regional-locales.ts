import type { Locale } from './locale.ts'

export const REGIONAL_LOCALES = {
  en: 'en-US',
  fr: 'fr-FR'
} as const satisfies Record<Locale, string>
