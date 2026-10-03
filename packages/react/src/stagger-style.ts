import type { CSSProperties } from 'react'

export type StaggerStyle = CSSProperties &
  Record<'--stagger-count' | '--stagger-index', number>

/**
 * Hands an item its place in a list to its stylesheet, which turns it into a
 * delay: `calc(var(--stagger-index) * var(--transition-fast))` on the way in,
 * `calc((var(--stagger-count) - 1 - var(--stagger-index)) *
 * var(--transition-fast))` to leave in reverse. A step taken from a duration
 * token drops to zero with it under reduced motion.
 */
export const staggerStyle = (index: number, count: number): StaggerStyle => ({
  '--stagger-count': count,
  '--stagger-index': index
})
