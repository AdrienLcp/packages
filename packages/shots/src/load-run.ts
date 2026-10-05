import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { Result } from '@adrienlcp/result'

import { parseCliArguments } from './cli-arguments.ts'
import {
  mergeSettings,
  type PartialSettings,
  parsePartialSettings
} from './parse-settings.ts'
import { readFileData } from './read-file-data.ts'
import { parseRouteMocks, type RouteMock } from './route-mocks.ts'
import type { SettingsError } from './settings-error.ts'
import { DEFAULT_CONFIG_FILE, type ShotsSettings } from './shots-settings.ts'

/** What the command line asks for: the usage, or a run with everything it needs. */
export type RunRequest =
  | { kind: 'help' }
  | { kind: 'shoot'; mocks: readonly RouteMock[]; settings: ShotsSettings }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const refusalOf = (
  refusal: 'malformed' | 'unreadable',
  path: string
): SettingsError =>
  refusal === 'malformed'
    ? { code: 'malformed_file', path }
    : { code: 'unreadable_file', path }

const configPathOf = (
  configFile: string | null,
  workingFolder: string
): string | null => {
  if (configFile !== null) return resolve(workingFolder, configFile)
  const defaultPath = resolve(workingFolder, DEFAULT_CONFIG_FILE)
  return existsSync(defaultPath) ? defaultPath : null
}

const readConfig = async (
  path: string | null
): Promise<Result<PartialSettings, SettingsError>> => {
  if (path === null) return Result.success({})

  const data = await readFileData(path)
  if (data.status === 'failure') {
    return Result.failure(refusalOf(data.error, path))
  }
  if (!isRecord(data.data)) {
    return Result.failure({ code: 'malformed_file', path })
  }
  return parsePartialSettings({
    baseFolder: dirname(path),
    raw: data.data,
    source: 'config'
  })
}

const readMocks = async (
  path: string | null
): Promise<Result<RouteMock[], SettingsError>> => {
  if (path === null) return Result.success([])

  const data = await readFileData(path)
  if (data.status === 'failure') {
    return Result.failure(refusalOf(data.error, path))
  }
  const mocks = parseRouteMocks(data.data)
  if (mocks.status === 'success') return mocks
  return Result.failure(
    mocks.error.code === 'not_a_list'
      ? { code: 'malformed_file', path }
      : { code: 'invalid_mock', index: mocks.error.index, path }
  )
}

/**
 * Builds a run from the command line: the config file (`--config`, or
 * `shots.config.json` when the working folder has one), the flags over it, and
 * the mocks file the result names.
 */
export const loadRun = async ({
  argv,
  workingFolder
}: {
  argv: readonly string[]
  workingFolder: string
}): Promise<Result<RunRequest, SettingsError>> => {
  const cli = parseCliArguments(argv)
  if (cli.status === 'failure') return cli
  if (cli.data.help) return Result.success({ kind: 'help' })

  const fromConfig = await readConfig(
    configPathOf(cli.data.configFile, workingFolder)
  )
  if (fromConfig.status === 'failure') return fromConfig

  const fromArguments = parsePartialSettings({
    baseFolder: workingFolder,
    raw: cli.data.settings,
    source: 'arguments'
  })
  if (fromArguments.status === 'failure') return fromArguments

  const settings = mergeSettings({
    fromArguments: fromArguments.data,
    fromConfig: fromConfig.data,
    workingFolder
  })
  if (settings.status === 'failure') return settings

  const mocks = await readMocks(settings.data.mocks)
  if (mocks.status === 'failure') return mocks

  return Result.success({
    kind: 'shoot',
    mocks: mocks.data,
    settings: settings.data
  })
}
