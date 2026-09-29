import { Result } from '@adrienlcp/result'

import type { StorageUnavailable } from './storage-errors.ts'

/** Removes whatever is stored under `key`; a missing key is not a failure. */
export const removeStored = (key: string): Result<void, StorageUnavailable> => {
  try {
    localStorage.removeItem(key)

    return Result.success()
  } catch {
    return Result.failure('unavailable')
  }
}
