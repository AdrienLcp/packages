import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { Result } from '@adrienlcp/result'

/** Why a data file gave nothing: it could not be read, or it is not what it claims to be. */
export type FileDataRefusal = 'malformed' | 'unreadable'

const MODULE_EXTENSIONS = new Set(['.js', '.mjs'])

const readJson = async (
  path: string
): Promise<Result<unknown, FileDataRefusal>> => {
  const text = await readFile(path, 'utf8').then(
    (content) => Result.success(content),
    () => Result.failure('unreadable' as const)
  )
  if (text.status === 'failure') return text

  try {
    const data: unknown = JSON.parse(text.data)
    return Result.success(data)
  } catch {
    return Result.failure('malformed')
  }
}

const hasDefaultExport = (module: unknown): module is { default: unknown } =>
  typeof module === 'object' && module !== null && 'default' in module

const readModuleDefault = async (
  path: string
): Promise<Result<unknown, FileDataRefusal>> => {
  const module: unknown = await import(pathToFileURL(path).href).catch(
    () => null
  )
  if (module === null) return Result.failure('unreadable')
  return hasDefaultExport(module)
    ? Result.success(module.default)
    : Result.failure('malformed')
}

/**
 * The data a file holds: parsed JSON, or the default export of a `.js` /
 * `.mjs` module, for data worth computing — a series of thirty days, say.
 */
export const readFileData = (
  path: string
): Promise<Result<unknown, FileDataRefusal>> =>
  MODULE_EXTENSIONS.has(extname(path))
    ? readModuleDefault(path)
    : readJson(path)
