import { Result } from '@adrienlcp/result'

import type { StorageUnavailable } from './storage-errors.ts'

/**
 * The text stored under `key`, or `null` when nothing is: an absence, never a
 * failure. Fails with `'unavailable'` where `localStorage` throws.
 */
export const readStoredText = (
  key: string
): Result<string | null, StorageUnavailable> => {
  try {
    return Result.success(localStorage.getItem(key))
  } catch {
    return Result.failure('unavailable')
  }
}
