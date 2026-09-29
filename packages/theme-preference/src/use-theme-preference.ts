import { useSyncExternalStore } from 'react'

import type { ThemePreference } from './theme-preference.ts'
import type { ThemePreferenceStore } from './theme-preference-store.ts'

/** A server-rendered page cannot know the visitor's choice. */
const preferenceWithoutADocument = (): ThemePreference => 'system'

/** The store's preference, re-rendering every component that shows it when it changes. */
export const useThemePreference = (
  store: ThemePreferenceStore
): {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
} => ({
  preference: useSyncExternalStore(
    store.subscribe,
    store.getPreference,
    preferenceWithoutADocument
  ),
  setPreference: store.setPreference
})
