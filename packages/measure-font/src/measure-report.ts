import { rounded, SIZE_ADJUST_DECIMALS } from './decimals.ts'
import type { FallbackMeasure, WeightMeasure } from './fallback-measure.ts'
import { isEmptyRange, type RatioBounds } from './line-bounds.ts'

/** Past this gap between the digits' ratio and the letters', a face scaled on the letters moves the digits visibly. */
export const FIGURES_GAP_WARNING = 0.1

const PERCENT = 100

const rangeText = ({ lower, upper }: RatioBounds) =>
  [
    lower === null ? '' : `${rounded(lower, 6)} ≤ `,
    'ratio',
    upper === null ? '' : ` < ${rounded(upper, 6)}`
  ].join('')

const boundsLines = (bounds: RatioBounds | null, written: number | null) => {
  if (bounds === null) return []
  if (isEmptyRange(bounds)) {
    const [tightest] = bounds.lines
    const widest = bounds.lines.find(({ kind }) => kind === 'below')
    return [
      `  no ratio keeps its ${bounds.lines.length} lines wrapped: "${tightest?.line.text}" must fit from ${rounded(bounds.lower ?? 0, 6)}, "${widest?.line.text}" must wrap below ${rounded(bounds.upper ?? 0, 6)}`
    ]
  }
  return [
    `  ${rangeText(bounds)} keeps its ${bounds.lines.length} lines wrapped as the web font wraps them: writes ${written}`
  ]
}

const weightLines = ({
  bounds,
  face,
  fallback,
  figures,
  ratio,
  weight,
  written,
  zero
}: WeightMeasure) => [
  [
    `${face} at ${weight}: zero ${rounded(zero)}em`,
    ratio === null ? '' : `, width ratio ${rounded(ratio)}`,
    figures === null ? '' : `, figures ratio ${rounded(figures)}`,
    ` over ${fallback}`
  ].join(''),
  ...boundsLines(bounds, written)
]

const metricsLines = ({ givenMetrics, metrics }: FallbackMeasure) => [
  `cap height from ${metrics.capHeightFrom === 'H' ? 'the H outline (the OS/2 table has none)' : 'the OS/2 table'}`,
  ...givenMetrics.map((edge) => `${edge} ${rounded(metrics[edge])}, as given`)
]

/** The measure as lines to read: one per weight, then where each number came from. */
export const measureReport = (measure: FallbackMeasure): string[] => [
  ...measure.weights.flatMap(weightLines),
  ...metricsLines(measure),
  `size-adjust ${rounded(measure.sizeAdjust, SIZE_ADJUST_DECIMALS)}, ${measure.sizeAdjustFrom === 'given' ? 'as given' : "fontaine's, computed from the first file"}`,
  ...(measure.missing.length === 0
    ? []
    : [`left out, drawn by no file: ${measure.missing.join(' ')}`]),
  ...measure.unused.map(
    (file) => `${file} draws none of the text; its subsets draw it`
  )
]

/** What the measure was asked over, for its warnings. */
export type WarningContext = {
  /** The text measured is the default pangram, not the app's. */
  defaultText: boolean
}

const figuresGapWarning = (
  { figures, plainFigures, ratio, weight }: WeightMeasure,
  figuresAsked: boolean
) => {
  const digits = figures ?? plainFigures
  if (ratio === null) return []
  const gap = Math.abs(digits / ratio - 1)
  if (gap <= FIGURES_GAP_WARNING) return []
  const percent = Math.round(gap * PERCENT)
  return [
    figuresAsked
      ? `at ${weight} the digits stand ${percent} % off the letters: keep $figures, and check the figure features and subsets — a gap this wide also comes from a measure gone wrong`
      : `at ${weight} the digits set ${percent} % off the letters in a face scaled on them: measure them with --figures for a face of their own`
  ]
}

/**
 * What the reader should not miss: ratios over the default pangram, digits
 * far off the letters, lines no ratio keeps, and a font whose
 * `USE_TYPO_METRICS` draws the line box from other metrics than `hhea`'s.
 */
export const measureWarnings = (
  measure: FallbackMeasure,
  { defaultText }: WarningContext
): string[] => {
  const figuresAsked = measure.weights.some(({ figures }) => figures !== null)
  const typo = measure.metrics.typo
  return [
    ...(defaultText && !measure.figuresOnly
      ? [
          "width ratios over the default pangram: measure the app's own text (--text, --text-from, --text-from-dist) before writing them"
        ]
      : []),
    ...measure.weights.flatMap((weight) =>
      figuresGapWarning(weight, figuresAsked)
    ),
    ...measure.weights.flatMap(({ bounds, weight }) =>
      bounds !== null && isEmptyRange(bounds)
        ? [
            `at ${weight} no ratio keeps every line: the include writes the text's ratio`
          ]
        : []
    ),
    ...(typo === null || measure.givenMetrics.length > 0
      ? []
      : [
          `the font sets USE_TYPO_METRICS: a browser that honours it draws the line box from ascent ${rounded(typo.ascent)} and descent ${rounded(typo.descent)}, not hhea's — pass them with --ascent and --descent to match it`
        ])
  ]
}
