import { createI18n, type Dictionary } from '@adrienlcp/i18n'

import { EN_DICTIONARY } from './dictionary-en.ts'
import { FR_DICTIONARY } from './dictionary-fr.ts'
import { DEFAULT_LOCALE, type Locale } from './locale.ts'

export const i18n = createI18n({
  defaultLocale: DEFAULT_LOCALE,
  dictionaries: { en: EN_DICTIONARY, fr: FR_DICTIONARY } satisfies Record<
    Locale,
    Dictionary
  >
})
