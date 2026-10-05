import type { ShotVariant } from './shot-variant.ts'
import type { ShotsSettings } from './shots-settings.ts'

/**
 * The `localStorage` a page of this variant opens on: the run's fixtures, then
 * the variant's locale and theme under the keys the app reads them from.
 */
export const storageEntriesOf = ({
  settings,
  variant
}: {
  settings: Pick<
    ShotsSettings,
    'localeStorageKey' | 'storage' | 'themeStorageKey'
  >
  variant: ShotVariant
}): Record<string, string> => {
  const entries = { ...settings.storage }
  if (settings.localeStorageKey !== null && variant.locale !== null) {
    entries[settings.localeStorageKey] = variant.locale
  }
  if (settings.themeStorageKey !== null && variant.theme !== null) {
    entries[settings.themeStorageKey] = variant.theme
  }
  return entries
}
