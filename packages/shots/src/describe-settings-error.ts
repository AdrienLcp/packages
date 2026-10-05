import type { SettingsError } from './settings-error.ts'
import type { SettingName } from './shots-settings.ts'

const EXPECTED = {
  fullPage: 'true or false',
  height: 'a whole number of pixels, 1 to 10000',
  localeStorageKey: 'a localStorage key',
  locales: 'BCP 47 tags, like en or fr-FR',
  mocks: 'the path of a .json, .js or .mjs file',
  origin: 'an http or https URL',
  out: 'a folder path',
  paths: 'paths starting with /',
  settleMs: 'a whole number of milliseconds',
  storage: 'key=value pairs (flags) or an object (config)',
  themeStorageKey: 'a localStorage key',
  themes: 'light or dark',
  time: 'an ISO 8601 instant with its offset, like 2026-10-03T12:00:00Z',
  timezone: 'an IANA time zone, like Europe/Paris',
  volumeKeys: 'localStorage keys',
  widths: 'whole numbers of pixels, 1 to 10000'
} as const satisfies Record<SettingName, string>

const SOURCE_WORDING = {
  arguments: 'the command line',
  config: 'the config file'
} as const

/** The message a settings failure prints, naming what to fix. */
export const describeSettingsError = (error: SettingsError): string => {
  switch (error.code) {
    case 'invalid_mock':
      return `Mock #${error.index + 1} in ${error.path} is not a mock: it needs a url and one of json, body, abort or hang.`
    case 'invalid_setting':
      return `"${error.setting}" from ${SOURCE_WORDING[error.source]} expects ${EXPECTED[error.setting]}.`
    case 'malformed_file':
      return `${error.path} does not hold what it should: JSON, or a module with a default export.`
    case 'missing_origin':
      return 'No origin: pass --origin http://localhost:5173 or set "origin" in shots.config.json.'
    case 'missing_value':
      return `--${error.option} needs a value.`
    case 'unknown_option':
      return `--${error.option} is not an option. Run shots --help.`
    case 'unknown_setting':
      return `"${error.setting}" from ${SOURCE_WORDING[error.source]} is not a setting.`
    case 'unreadable_file':
      return `${error.path} could not be read.`
  }
}
