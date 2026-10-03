import { createI18n, type Dictionary } from '@adrienlcp/i18n'

import { EN_DICTIONARY } from './dictionary-en'
import { FR_DICTIONARY } from './dictionary-fr'
import { DEFAULT_LOCALE, type Locale } from './locale'

export const i18n = createI18n({
  defaultLocale: DEFAULT_LOCALE,
  dictionaries: { en: EN_DICTIONARY, fr: FR_DICTIONARY } satisfies Record<
    Locale,
    Dictionary
  >
})
