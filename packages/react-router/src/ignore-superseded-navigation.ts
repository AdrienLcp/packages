/**
 * A navigation superseded by the next one rejects with `AbortError`, more
 * often with view transitions on: expected control flow, not a failure. Any
 * other error is thrown again.
 */
export const ignoreSupersededNavigation = (error: unknown): void => {
  if (error instanceof Error && error.name === 'AbortError') {
    return
  }

  throw error
}
