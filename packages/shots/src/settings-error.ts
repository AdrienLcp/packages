import type { SettingName } from './shots-settings.ts'

/** Where a setting came from, so a message can point at it. */
export type SettingsSource = 'arguments' | 'config'

/** Why the settings of a run could not be built. Closed: the CLI words each one. */
export type SettingsError =
  | { code: 'invalid_mock'; index: number; path: string }
  | { code: 'invalid_setting'; setting: SettingName; source: SettingsSource }
  | { code: 'malformed_file'; path: string }
  | { code: 'missing_origin' }
  | { code: 'missing_value'; option: string }
  | { code: 'unknown_option'; option: string }
  | { code: 'unknown_setting'; setting: string; source: SettingsSource }
  | { code: 'unreadable_file'; path: string }
