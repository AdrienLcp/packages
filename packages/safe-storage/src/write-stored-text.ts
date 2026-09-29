import { Result } from '@adrienlcp/result'

import { isQuotaExceeded } from './is-quota-exceeded.ts'
import type { StorageWriteError } from './storage-errors.ts'

/**
 * Stores `text` under `key`. Fails with `'quota'` when the origin's storage is
 * full — and on Safari before 11, whose private window reported every write
 * that way — and with `'unavailable'` where `localStorage` throws otherwise.
 */
export const writeStoredText = ({
  key,
  text
}: {
  key: string
  text: string
}): Result<void, StorageWriteError> => {
  try {
    localStorage.setItem(key, text)

    return Result.success()
  } catch (error) {
    return Result.failure(isQuotaExceeded(error) ? 'quota' : 'unavailable')
  }
}
