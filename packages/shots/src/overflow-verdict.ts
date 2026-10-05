import type { OverflowCandidate, OverflowMeasure } from './measure-overflow.ts'

/** An element that sticks out, and by how many pixels past the nearest edge. */
export type OverflowCulprit = { excess: number; label: string }

/** Whether a page fits its viewport, and if not, by how much and because of what. */
export type OverflowVerdict =
  | { culprits: OverflowCulprit[]; excess: number; status: 'overflows' }
  | { status: 'fits' }

const MAX_CULPRITS = 3
const PATH_SEPARATOR = '>'

const isInnermost = (
  candidate: OverflowCandidate,
  candidates: readonly OverflowCandidate[]
): boolean =>
  !candidates.some((other) =>
    other.path.startsWith(candidate.path + PATH_SEPARATOR)
  )

const excessOf = (candidate: OverflowCandidate, viewportWidth: number) =>
  Math.ceil(Math.max(candidate.right - viewportWidth, -candidate.left))

/**
 * A page overflows when its document is wider than its viewport. The culprits
 * are the innermost elements sticking out — a wide table, not every wrapper
 * around it — first in document order, at most three.
 */
export const overflowVerdictOf = ({
  candidates,
  documentWidth,
  viewportWidth
}: OverflowMeasure): OverflowVerdict => {
  const excess = Math.ceil(documentWidth - viewportWidth)
  if (excess <= 0) return { status: 'fits' }

  const culprits = candidates
    .filter((candidate) => isInnermost(candidate, candidates))
    .slice(0, MAX_CULPRITS)
    .map((candidate) => ({
      excess: excessOf(candidate, viewportWidth),
      label: candidate.label
    }))

  return { culprits, excess, status: 'overflows' }
}
