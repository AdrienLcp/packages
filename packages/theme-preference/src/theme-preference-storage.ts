import { isColorScheme, type ThemePreference } from './theme-preference.ts'

/**
 * The stored preference, or `'system'` when nothing usable is stored: storage
 * that throws (a Safari private window), holds nothing, or holds a value this
 * version does not know.
 */
export const readStoredThemePreference = (
  storageKey: string
): ThemePreference => {
  try {
    const stored = localStorage.getItem(storageKey)

    return isColorScheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
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
  try {
    if (preference === 'system') {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, preference)
    }
  } catch {}
}
