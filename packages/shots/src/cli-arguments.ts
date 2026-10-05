import { parseArgs } from 'node:util'

import { Result } from '@adrienlcp/result'

import type { SettingsError } from './settings-error.ts'
import type { SettingName } from './shots-settings.ts'

/** What the command line asked for, before any setting is checked. */
export type CliArguments = {
  /** `--config`, or `null` to look for the default file. */
  configFile: string | null
  help: boolean
  /** The settings the flags give, shaped as a config file would hold them. */
  settings: Record<string, unknown>
}

type FlagKind = 'entries' | 'list' | 'number' | 'numbers' | 'text'

type SettingFlag = { kind: FlagKind; setting: SettingName }

const SETTING_FLAGS = {
  height: { kind: 'number', setting: 'height' },
  'locale-storage-key': { kind: 'text', setting: 'localeStorageKey' },
  locales: { kind: 'list', setting: 'locales' },
  mocks: { kind: 'text', setting: 'mocks' },
  origin: { kind: 'text', setting: 'origin' },
  out: { kind: 'text', setting: 'out' },
  paths: { kind: 'list', setting: 'paths' },
  settle: { kind: 'number', setting: 'settleMs' },
  storage: { kind: 'entries', setting: 'storage' },
  'theme-storage-key': { kind: 'text', setting: 'themeStorageKey' },
  themes: { kind: 'list', setting: 'themes' },
  time: { kind: 'text', setting: 'time' },
  timezone: { kind: 'text', setting: 'timezone' },
  'volume-key': { kind: 'list', setting: 'volumeKeys' },
  widths: { kind: 'numbers', setting: 'widths' }
} as const satisfies Record<string, SettingFlag>

const CONFIG_FLAG = 'config'
const HELP_FLAG = 'help'
const VIEWPORT_ONLY_FLAG = 'viewport-only'
const ENTRY_SEPARATOR = '='
const LIST_SEPARATOR = ','

const BOOLEAN_FLAGS = new Set([HELP_FLAG, VIEWPORT_ONLY_FLAG])

const isSettingFlag = (flag: string): flag is keyof typeof SETTING_FLAGS =>
  Object.hasOwn(SETTING_FLAGS, flag)

const listItemsOf = (texts: readonly string[]): string[] =>
  texts.flatMap((text) =>
    text
      .split(LIST_SEPARATOR)
      .map((item) => item.trim())
      .filter((item) => item !== '')
  )

const entriesOf = (texts: readonly string[]): Record<string, string> | null => {
  const entries = texts.map((text) => {
    const separatorAt = text.indexOf(ENTRY_SEPARATOR)
    return separatorAt <= 0
      ? null
      : [text.slice(0, separatorAt), text.slice(separatorAt + 1)]
  })
  const complete = entries.filter((entry) => entry !== null)
  return complete.length === entries.length
    ? Object.fromEntries(complete)
    : null
}

const settingValueOf = (kind: FlagKind, texts: readonly string[]): unknown => {
  switch (kind) {
    case 'entries':
      return entriesOf(texts)
    case 'list':
      return listItemsOf(texts)
    case 'number':
      return Number(texts.at(-1))
    case 'numbers':
      return listItemsOf(texts).map(Number)
    case 'text':
      return texts.at(-1)
  }
}

const REPEATABLE_TEXT = { multiple: true, type: 'string' } as const

const OPTIONS = {
  ...Object.fromEntries(
    Object.keys(SETTING_FLAGS).map((flag) => [flag, REPEATABLE_TEXT])
  ),
  [CONFIG_FLAG]: { multiple: true, type: 'string' },
  [HELP_FLAG]: { short: 'h', type: 'boolean' },
  [VIEWPORT_ONLY_FLAG]: { type: 'boolean' }
} as const

const textsOf = (value: unknown): string[] | null => {
  const values = Array.isArray(value) ? value : [value]
  const texts = values.filter((item) => typeof item === 'string')
  return texts.length === values.length ? texts : null
}

/**
 * Reads the command line: `shots [paths…] --origin <url> --widths 320,360 …`.
 * A list flag takes commas, repeats, or both; bare words are paths. An option
 * nobody knows, or one left without its value, fails rather than being ignored.
 */
export const parseCliArguments = (
  argv: readonly string[]
): Result<CliArguments, SettingsError> => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: [...argv],
    options: OPTIONS,
    strict: false
  })

  const settings: Record<string, unknown> = {}
  let configFile: string | null = null

  for (const [flag, value] of Object.entries(values)) {
    if (BOOLEAN_FLAGS.has(flag)) continue

    if (flag !== CONFIG_FLAG && !isSettingFlag(flag)) {
      return Result.failure({ code: 'unknown_option', option: flag })
    }

    const texts = textsOf(value)
    if (texts === null) {
      return Result.failure({ code: 'missing_value', option: flag })
    }

    if (isSettingFlag(flag)) {
      const { kind, setting } = SETTING_FLAGS[flag]
      settings[setting] = settingValueOf(kind, texts)
    } else {
      configFile = texts.at(-1) ?? null
    }
  }

  if (positionals.length > 0) {
    const flagged = Array.isArray(settings.paths) ? settings.paths : []
    settings.paths = [...positionals, ...flagged]
  }

  if (values[VIEWPORT_ONLY_FLAG] === true) {
    settings.fullPage = false
  }

  return Result.success({
    configFile,
    help: values[HELP_FLAG] === true,
    settings
  })
}
