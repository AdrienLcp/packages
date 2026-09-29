import type { Result } from '@adrienlcp/result'

import type { StorageWriteError } from './storage-errors.ts'
import { writeStoredText } from './write-stored-text.ts'

/**
 * Stores `value` as JSON under `key`, refused like `writeStoredText`. A value
 * `JSON.stringify` cannot write — a cycle, a `bigint` — still throws: that is
 * a bug in the caller, not a refusal of the platform.
 */
export const writeStoredJson = ({
  key,
  value
}: {
  key: string
  value: unknown
}): Result<void, StorageWriteError> =>
  writeStoredText({ key, text: JSON.stringify(value) })
