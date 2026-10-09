import {
  fontaineSizeAdjust,
  type OpenedFont,
  type VerticalMetrics,
  verticalMetrics,
  widthRatio,
  zeroWidth
} from './font-metrics.ts'

/** One file of the family, as the app serves it. */
export type FamilyFile = { name: string; font: OpenedFont }

/** What `measureFallbackFaces` measures a family against. */
export type FallbackMeasureInput = {
  /** The family's files; the first is the one fontaine measures. */
  files: readonly FamilyFile[]
  /** Arial and Arial Bold — or their italic cuts, for the italic files. */
  regular: OpenedFont
  bold: OpenedFont
  /** The app's own text. */
  text: string
  /** The weights a variable file is measured at; a static file is measured at its own. */
  weights: readonly number[]
  /** From this weight up, the band is drawn in `bold` (650, as `fallback-faces`). */
  boldFrom: number
  /** The `size-adjust` in the built CSS; fontaine's own computation from the first file when left out. */
  sizeAdjust?: number
  /**
   * Measures the digits apart, set with these OpenType features — `tnum` and
   * `lnum` for `tabular-nums lining-nums` — for a figures face of their own.
   */
  figures?: { features: readonly string[] }
}

/** One weight of one file. */
export type WeightMeasure = {
  file: string
  weight: number
  /** The zero's advance in em at this weight: what one `ch` is. */
  zero: number
  /** The `$widths` entry for this weight. */
  ratio: number
  /** The `$figures` entry for this weight, when the digits were measured. */
  figures: number | null
  /** The full name of the Arial cut the ratio is over. */
  fallback: string
}

export type FallbackMeasure = {
  weights: WeightMeasure[]
  metrics: VerticalMetrics
  sizeAdjust: number
  sizeAdjustFrom: 'given' | 'first-file'
}

const DIGITS = '0123456789'

/**
 * The text as a browser lays it out under `white-space: normal`: every run of
 * spaces, tabs and newlines one space, none at either end. A newline measured
 * raw is a glyph of its own and widens every ratio.
 */
export const collapseWhiteSpace = (text: string): string =>
  text.replace(/\s+/g, ' ').trim()

const weightsOf = (font: OpenedFont, weights: readonly number[]) =>
  font.weightAxis === null || weights.length === 0 ? [font.weight] : weights

/**
 * Measures a family for `fonts.fallback-faces`: its vertical metrics from the
 * first file, the `size-adjust` fontaine gives every face, and per weight the
 * zero's advance and the width ratio over the Arial cut that band is drawn in.
 * Static files — one per weight — are each measured at their own weight
 * against the first file's `size-adjust`, which fontaine copies to them all.
 */
export const measureFallbackFaces = async ({
  bold,
  boldFrom,
  figures,
  files,
  regular,
  sizeAdjust: givenSizeAdjust,
  text,
  weights
}: FallbackMeasureInput): Promise<FallbackMeasure | null> => {
  const [first] = files
  const measured = collapseWhiteSpace(text)
  if (first === undefined || measured === '') return null
  const sizeAdjust =
    givenSizeAdjust ?? (await fontaineSizeAdjust(first.font, regular))
  return {
    metrics: verticalMetrics(first.font),
    sizeAdjust,
    sizeAdjustFrom: givenSizeAdjust === undefined ? 'first-file' : 'given',
    weights: files.flatMap(({ font, name }) =>
      weightsOf(font, weights).map((weight) => {
        const fallback = weight >= boldFrom ? bold : regular
        return {
          fallback: fallback.font.fullName,
          figures:
            figures === undefined
              ? null
              : widthRatio({
                  fallback,
                  features: figures.features,
                  font,
                  sizeAdjust,
                  text: DIGITS,
                  weight
                }),
          file: name,
          ratio: widthRatio({
            fallback,
            font,
            sizeAdjust,
            text: measured,
            weight
          }),
          weight,
          zero: zeroWidth(font, weight)
        }
      })
    )
  }
}

const RATIO_DECIMALS = 4
const SIZE_ADJUST_DECIMALS = 6

const rounded = (value: number, decimals = RATIO_DECIMALS) =>
  Number(value.toFixed(decimals))

/**
 * The `fonts.fallback-faces` include for a measure, one `$widths` entry per
 * weight measured: widen each weight to the band of weights it stands for.
 */
export const fallbackFacesInclude = (
  family: string,
  { metrics, sizeAdjust, weights }: FallbackMeasure,
  { italic = false }: { italic?: boolean } = {}
): string => {
  const metricsMap = `(ascent: ${rounded(metrics.ascent)}, descent: ${rounded(metrics.descent)}, cap-height: ${rounded(metrics.capHeight)})`
  const widths = weights
    .map(({ ratio, weight }) => `${weight}: ${rounded(ratio)}`)
    .join(', ')
  const figureEntries = weights.flatMap(({ figures, weight }) =>
    figures === null ? [] : [`${weight}: ${rounded(figures)}`]
  )
  const figures =
    figureEntries.length === 0
      ? ''
      : `, $figures: (${figureEntries.join(', ')})`
  const style = italic ? ', $style: italic' : ''
  return `@include fonts.fallback-faces('${family}', ${metricsMap}, ${rounded(sizeAdjust, SIZE_ADJUST_DECIMALS)}, (${widths})${figures}${style})`
}

/** The measure as lines to read: one per weight, then where each number came from. */
export const measureReport = ({
  metrics,
  sizeAdjust,
  sizeAdjustFrom,
  weights
}: FallbackMeasure): string[] => [
  ...weights.map(
    ({ fallback, figures, file, ratio, weight, zero }) =>
      `${file} at ${weight}: zero ${rounded(zero)}em, width ratio ${rounded(ratio)}${figures === null ? '' : `, figures ratio ${rounded(figures)}`} over ${fallback}`
  ),
  `cap height from ${metrics.capHeightFrom === 'H' ? 'the H outline (the OS/2 table has none)' : 'the OS/2 table'}`,
  `size-adjust ${rounded(sizeAdjust, SIZE_ADJUST_DECIMALS)}, ${sizeAdjustFrom === 'given' ? 'as given' : "fontaine's, computed from the first file"}`
]
