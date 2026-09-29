import { Result } from '@adrienlcp/result'

import { readStoredText } from './read-stored-text.ts'
import type { StorageReadError } from './storage-errors.ts'

/**
 * The text stored under `key`, narrowed by `isRecognized` — a locale, a theme,
 * any closed set of strings. `null` when nothing is stored; `'unrecognized'`
 * when the stored text is not one the guard accepts, such as a value an older
 * version of the app wrote.
 */
export const readRecognizedText = <Value extends string>({
  isRecognized,
  key
}: {
  isRecognized: (stored: string) => stored is Value
  key: string
}): Result<Value | null, StorageReadError> => {
  const stored = readStoredText(key)

  if (stored.status === 'failure') {
    return stored
  }

  if (stored.data === null) {
    return Result.success(null)
  }

  return isRecognized(stored.data)
    ? Result.success(stored.data)
    : Result.failure('unrecognized')
}
