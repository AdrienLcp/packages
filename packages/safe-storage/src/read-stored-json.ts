import { Result } from '@adrienlcp/result'

import { readStoredText } from './read-stored-text.ts'
import type { StorageReadError } from './storage-errors.ts'

const parsedJsonOrNothing = (text: string): Result<unknown, 'unrecognized'> => {
  try {
    const parsed: unknown = JSON.parse(text)

    return Result.success(parsed)
  } catch {
    return Result.failure('unrecognized')
  }
}

/**
 * The JSON stored under `key`, parsed and narrowed by `isValue`. `null` when
 * nothing is stored; `'unrecognized'` when the text is not JSON or the guard
 * refuses its shape. A schema library plugs in through its own guard:
 * `(value): value is Log => logSchema.safeParse(value).success`.
 */
export const readStoredJson = <Value>({
  isValue,
  key
}: {
  isValue: (value: unknown) => value is Value
  key: string
}): Result<Value | null, StorageReadError> => {
  const stored = readStoredText(key)

  if (stored.status === 'failure') {
    return stored
  }

  if (stored.data === null) {
    return Result.success(null)
  }

  const parsed = parsedJsonOrNothing(stored.data)

  if (parsed.status === 'failure') {
    return parsed
  }

  return isValue(parsed.data)
    ? Result.success(parsed.data)
    : Result.failure('unrecognized')
}
