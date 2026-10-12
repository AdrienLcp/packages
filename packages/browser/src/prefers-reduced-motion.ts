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
