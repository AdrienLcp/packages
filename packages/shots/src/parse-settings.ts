import { resolve } from 'node:path'

import { Result } from '@adrienlcp/result'

import { type SettingReaders, settingReadersFrom } from './setting-readers.ts'
import type { SettingsError, SettingsSource } from './settings-error.ts'
import {
  DEFAULT_OUT_FOLDER,
  SETTINGS_DEFAULTS,
  type SettingName,
  type ShotsSettings
} from './shots-settings.ts'

/** Settings one source gave: a config file, or the flags. */
export type PartialSettings = Partial<ShotsSettings>

const isSettingName = (
  readers: SettingReaders,
  name: string
): name is SettingName => Object.hasOwn(readers, name)

const readInto = <Name extends SettingName>({
  name,
  readers,
  settings,
  value
}: {
  name: Name
  readers: SettingReaders
  settings: PartialSettings
  value: unknown
}): boolean => {
  const read = readers[name](value)
  if (read === null) return false
  settings[name] = read
  return true
}

/**
 * Checks what one source gives, setting by setting. A name no setting has and a
 * value a setting refuses both fail, naming the setting, so a typo in a config
 * file never passes silently.
 */
export const parsePartialSettings = ({
  baseFolder,
  raw,
  source
}: {
  baseFolder: string
  raw: Readonly<Record<string, unknown>>
  source: SettingsSource
}): Result<PartialSettings, SettingsError> => {
  const readers = settingReadersFrom(baseFolder)
  const settings: PartialSettings = {}

  for (const [name, value] of Object.entries(raw)) {
    if (!isSettingName(readers, name)) {
      return Result.failure({ code: 'unknown_setting', setting: name, source })
    }
    if (!readInto({ name, readers, settings, value })) {
      return Result.failure({ code: 'invalid_setting', setting: name, source })
    }
  }

  return Result.success(settings)
}

/**
 * The settings of a run: the defaults, then the config file over them, then the
 * flags over both. `origin` is the one setting that must come from somewhere.
 */
export const mergeSettings = ({
  fromArguments,
  fromConfig,
  workingFolder
}: {
  fromArguments: PartialSettings
  fromConfig: PartialSettings
  workingFolder: string
}): Result<ShotsSettings, SettingsError> => {
  const origin = fromArguments.origin ?? fromConfig.origin

  if (origin === undefined) {
    return Result.failure({ code: 'missing_origin' })
  }

  return Result.success({
    ...SETTINGS_DEFAULTS,
    out: resolve(workingFolder, DEFAULT_OUT_FOLDER),
    ...fromConfig,
    ...fromArguments,
    origin
  })
}
