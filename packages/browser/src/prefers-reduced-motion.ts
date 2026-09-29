export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const reducedMotionQuery = (): MediaQueryList | null =>
  typeof matchMedia === 'function' ? matchMedia(REDUCED_MOTION_QUERY) : null

/**
 * Whether the reader asked the system for less motion. `false` where there is
 * no `matchMedia`, as on a server: motion is the default a stylesheet starts
 * from.
 */
export const prefersReducedMotion = (): boolean =>
  reducedMotionQuery()?.matches ?? false

/** Calls `listener` whenever the preference changes; returns the unsubscribe. */
export const subscribeToReducedMotion = (
  listener: () => void
): (() => void) => {
  const query = reducedMotionQuery()

  query?.addEventListener('change', listener)

  return () => {
    query?.removeEventListener('change', listener)
  }
}
