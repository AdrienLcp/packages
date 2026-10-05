import { resolve } from 'node:path'

import { epochMsOfInstant } from './instant.ts'
import type { SettingName, ShotsSettings, Theme } from './shots-settings.ts'

/** One reader per setting: the value it accepts, or `null` when it refuses it. */
export type SettingReaders = {
  [Name in SettingName]: (value: unknown) => ShotsSettings[Name] | null
}

const MAX_VIEWPORT_SIZE = 10_000

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isTheme = (value: unknown): value is Theme =>
  value === 'dark' || value === 'light'

const isViewportSize = (value: unknown): value is number =>
  Number.isInteger(value) &&
  typeof value === 'number' &&
  value > 0 &&
  value <= MAX_VIEWPORT_SIZE

const isPath = (value: unknown): value is string =>
  isNonEmptyString(value) && value.startsWith('/')

const isLocaleTag = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false
  try {
    return Intl.getCanonicalLocales(value).length === 1
  } catch {
    return false
  }
}

const isTimeZone = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

const listOf =
  <Item>(isItem: (value: unknown) => value is Item) =>
  (value: unknown): Item[] | null => {
    if (!Array.isArray(value)) return null
    const items = value.filter(isItem)
    return items.length === value.length ? items : null
  }

const nonEmptyListOf = <Item>(isItem: (value: unknown) => value is Item) => {
  const readList = listOf(isItem)
  return (value: unknown): Item[] | null => {
    const items = readList(value)
    return items === null || items.length === 0 ? null : items
  }
}

const accepted =
  <Value>(isValue: (value: unknown) => value is Value) =>
  (value: unknown): Value | null =>
    isValue(value) ? value : null

const readOrigin = (value: unknown): string | null => {
  if (!isNonEmptyString(value) || !URL.canParse(value)) return null
  const url = new URL(value)
  return url.protocol === 'http:' || url.protocol === 'https:'
    ? url.origin
    : null
}

const readStorage = (value: unknown): Record<string, string> | null =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          typeof entry === 'string' ? entry : JSON.stringify(entry)
        ])
      )
    : null

const readTime = (value: unknown): number | null => {
  if (!isNonEmptyString(value)) return null
  const instant = epochMsOfInstant(value)
  return instant.status === 'success' ? instant.data : null
}

const isSettleDelay = (value: unknown): value is number =>
  Number.isInteger(value) && typeof value === 'number' && value >= 0

/**
 * The readers of every setting. A file path is resolved from `baseFolder`:
 * the config file's folder for a config file, the working directory for a flag.
 */
export const settingReadersFrom = (baseFolder: string): SettingReaders => {
  const readFilePath = (value: unknown): string | null =>
    isNonEmptyString(value) ? resolve(baseFolder, value) : null

  return {
    fullPage: (value) => (typeof value === 'boolean' ? value : null),
    height: accepted(isViewportSize),
    localeStorageKey: accepted(isNonEmptyString),
    locales: nonEmptyListOf(isLocaleTag),
    mocks: readFilePath,
    origin: readOrigin,
    out: readFilePath,
    paths: nonEmptyListOf(isPath),
    settleMs: accepted(isSettleDelay),
    storage: readStorage,
    themeStorageKey: accepted(isNonEmptyString),
    themes: nonEmptyListOf(isTheme),
    time: readTime,
    timezone: accepted(isTimeZone),
    volumeKeys: listOf(isNonEmptyString),
    widths: nonEmptyListOf(isViewportSize)
  }
}
