import {
  readRecognizedText,
  removeStored,
  writeStoredText
} from '@adrienlcp/safe-storage'

import { isColorScheme, type ThemePreference } from './theme-preference.ts'

/**
 * The stored preference, or `'system'` when nothing usable is stored: storage
 * that throws (a Safari private window), holds nothing, or holds a value this
 * version does not know.
 */
export const readStoredThemePreference = (
  storageKey: string
): ThemePreference => {
  const stored = readRecognizedText({
    isRecognized: isColorScheme,
    key: storageKey
  })

  return stored.status === 'success' && stored.data !== null
    ? stored.data
    : 'system'
}

/**
 * `'system'` is stored as no entry at all, which is what the pre-paint script
 * leaves alone. Storage that throws keeps the choice for this page view only.
 */
export const writeStoredThemePreference = ({
  preference,
  storageKey
}: {
  preference: ThemePreference
  storageKey: string
}): void => {
  if (preference === 'system') {
    removeStored(storageKey)
  } else {
    writeStoredText({ key: storageKey, text: preference })
  }
}
