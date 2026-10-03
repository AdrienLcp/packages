import type { Result } from '@adrienlcp/result'
import {
  readRecognizedText,
  type StorageReadError,
  type StorageWriteError,
  writeStoredText
} from '@adrienlcp/safe-storage'

import { isLocale, type Locale } from '@/presentation/i18n/locale'

const LOCALE_KEY = 'docs:locale'

/**
 * Succeeds with `null` when no locale was ever chosen, which is not the
 * default: the caller then follows the browser.
 */
export const readStoredLocale = (): Result<Locale | null, StorageReadError> =>
  readRecognizedText({ isRecognized: isLocale, key: LOCALE_KEY })

export const writeStoredLocale = (
  locale: Locale
): Result<void, StorageWriteError> =>
  writeStoredText({ key: LOCALE_KEY, text: locale })
