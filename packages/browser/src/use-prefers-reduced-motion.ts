import { useSyncExternalStore } from 'react'

import {
  prefersReducedMotion,
  subscribeToReducedMotion
} from './prefers-reduced-motion.ts'

/** A server render cannot know the preference, so it renders the motion. */
const reducedMotionWithoutADocument = (): boolean => false

/** The reduced-motion preference, re-rendering when the reader changes it. */
export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    reducedMotionWithoutADocument
  )
