import type { OverflowCulprit } from './overflow-verdict.ts'
import type { ShotFailure, ShotReport } from './take-shots.ts'

/** The text a run prints, and the exit code it ends with: 1 when a shot is missing. */
export type RunSummary = { exitCode: number; text: string }

const FAILURE_WORDING = {
  unreachable: 'page did not load',
  unwritable: 'PNG could not be written'
} as const satisfies Record<ShotFailure, string>

const culpritsText = (culprits: readonly OverflowCulprit[]): string =>
  culprits.length === 0
    ? 'no single element found'
    : culprits.map(({ excess, label }) => `${label} (+${excess}px)`).join(', ')

const problemLineOf = ({ fileName, outcome }: ShotReport): string | null => {
  if (outcome.status === 'failed') {
    return `  failed    ${fileName}  ${FAILURE_WORDING[outcome.reason]}`
  }
  if (outcome.overflow.status === 'overflows') {
    const { culprits, excess } = outcome.overflow
    return `  overflow  ${fileName}  ${excess}px wider than the viewport: ${culpritsText(culprits)}`
  }
  return null
}

const plural = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? '' : 's'}`

/**
 * One line of counts, then one line per shot worth a look: those wider than
 * their viewport, with the elements that stick out, and those missing.
 */
export const summarize = ({
  out,
  reports
}: {
  out: string
  reports: readonly ShotReport[]
}): RunSummary => {
  const problems = reports.map(problemLineOf).filter((line) => line !== null)
  const failed = reports.filter(({ outcome }) => outcome.status === 'failed')
  const overflowing = reports.filter(
    ({ outcome }) =>
      outcome.status === 'taken' && outcome.overflow.status === 'overflows'
  )
  const taken = reports.length - failed.length
  const counts = `${plural(taken, 'shot')} in ${out} — ${overflowing.length} overflowing, ${failed.length} failed`

  return {
    exitCode: failed.length > 0 ? 1 : 0,
    text: [counts, ...problems].join('\n')
  }
}
