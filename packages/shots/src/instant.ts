import { Result } from '@adrienlcp/result'

/**
 * The epoch milliseconds of an ISO 8601 instant with its offset
 * (`2026-10-03T12:00:00Z`); `'invalid'` for a date without a zone or any
 * other text.
 */
export const epochMsOfInstant = (text: string): Result<number, 'invalid'> => {
  try {
    return Result.success(Temporal.Instant.from(text).epochMilliseconds)
  } catch {
    return Result.failure('invalid')
  }
}
