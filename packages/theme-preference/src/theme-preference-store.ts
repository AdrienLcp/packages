import { applyThemePreference } from './apply-theme-preference.ts'
import { prePaintScriptFor } from './pre-paint-script.ts'
import type { ThemePreference } from './theme-preference.ts'
import {
  readStoredThemePreference,
  writeStoredThemePreference
} from './theme-preference-storage.ts'

export type ThemePreferenceStore = {
  /** Read from storage on first call, then kept in memory. */
  readonly getPreference: () => ThemePreference
  /** Inline it in `<head>`, after the `theme-color` tags. */
  readonly prePaintScript: string
  /** Persists, applies to the document, then notifies every subscriber. */
  readonly setPreference: (preference: ThemePreference) => void
  readonly storageKey: string
  /** Returns the unsubscribe function. */
  readonly subscribe: (listener: () => void) => () => void
}

/**
 * One store per page, so every switch showing the theme reads the same
 * choice. Creating it touches neither storage nor the document: it can be
 * imported where there is no DOM, like a Vite config or a prerender.
 */
export const createThemePreferenceStore = ({
  storageKey
}: {
  storageKey: string
}): ThemePreferenceStore => {
  let current: ThemePreference | null = null
  const listeners = new Set<() => void>()

  const getPreference = (): ThemePreference => {
    current ??= readStoredThemePreference(storageKey)

    return current
  }

  const setPreference = (preference: ThemePreference): void => {
    current = preference
    writeStoredThemePreference({ preference, storageKey })
    applyThemePreference(preference)

    for (const listener of listeners) {
      listener()
    }
  }

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }

  return {
    getPreference,
    prePaintScript: prePaintScriptFor(storageKey),
    setPreference,
    storageKey,
    subscribe
  }
}
