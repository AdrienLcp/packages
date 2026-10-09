import { type OpenedFont, textWidth, type Variation } from './font-metrics.ts'
import { coverageOf, type ServedFace, servedTextWidth } from './served-face.ts'

/**
 * A line of the app set at the edge of its box: the one that just fits, or
 * the one a word too long that wraps. Widths in em of the line's font size.
 */
export type EdgeLine = {
  text: string
  /** The width the line is laid out in — the box's content width over the font size. */
  box: number
  /** The weight the line is set in; the first weight measured when left out. */
  weight?: number
  /** `letter-spacing` in em, added after every character in both faces. */
  letterSpacing?: number
}

/**
 * What one line asks of a band's ratio: the web font fits it in its box, so
 * the fallback face must fit it too (`at-least`), or the web font wraps it,
 * so the fallback must wrap it too (`below`).
 */
export type LineBound = {
  line: EdgeLine
  kind: 'at-least' | 'below'
  ratio: number
}

/**
 * The ratios that keep every edge line of a band wrapped as the web font
 * wraps it: `lower ≤ ratio < upper`, either end open when no line bounds it.
 */
export type RatioBounds = {
  lower: number | null
  upper: number | null
  /** The bounds the lines set, the tightest first on each side. */
  lines: readonly LineBound[]
}

/** What `lineBound` reads one line in. */
export type LineBoundInput = {
  face: ServedFace
  variation: Variation
  /** The Arial cut the band is drawn in. */
  fallback: OpenedFont
  sizeAdjust: number
  line: EdgeLine
}

/**
 * The bound one line sets on a band's ratio. The fallback face sets the
 * line `arial × size-adjust / ratio + spacing` wide, so it fits the box from
 * `ratio = arial × size-adjust / (box − spacing)` up. `null` when the face
 * draws none of the line, or its spacing alone fills the box.
 */
export const lineBound = ({
  face,
  fallback,
  line,
  sizeAdjust,
  variation
}: LineBoundInput): LineBound | null => {
  const { drawn } = coverageOf(face, line.text)
  const spacing = (line.letterSpacing ?? 0) * [...drawn].length
  const room = line.box - spacing
  if (drawn === '' || room <= 0) return null
  const webWidth = servedTextWidth(face, drawn, variation) + spacing
  return {
    kind: webWidth <= line.box ? 'at-least' : 'below',
    line,
    ratio: (textWidth(fallback, drawn) * sizeAdjust) / room
  }
}

/** The bounds a band's lines set together. */
export const ratioBounds = (bounds: readonly LineBound[]): RatioBounds => {
  const atLeast = bounds
    .filter(({ kind }) => kind === 'at-least')
    .toSorted((first, second) => second.ratio - first.ratio)
  const below = bounds
    .filter(({ kind }) => kind === 'below')
    .toSorted((first, second) => first.ratio - second.ratio)
  return {
    lines: [...atLeast, ...below],
    lower: atLeast[0]?.ratio ?? null,
    upper: below[0]?.ratio ?? null
  }
}

/** Whether no ratio keeps every line: a line that must fit is wider than one that must wrap. */
export const isEmptyRange = ({ lower, upper }: RatioBounds): boolean =>
  lower !== null && upper !== null && lower >= upper

const DECIMALS = [4, 5, 6] as const

const onGrid = (value: number, decimals: number) =>
  Number(value.toFixed(decimals))

const roundUp = (value: number, decimals: number) =>
  onGrid(Math.ceil(value * 10 ** decimals) / 10 ** decimals, decimals)

const lastBelow = (value: number, decimals: number) => {
  const floor = onGrid(
    Math.floor(value * 10 ** decimals) / 10 ** decimals,
    decimals
  )
  return floor < value ? floor : onGrid(floor - 10 ** -decimals, decimals)
}

const isWithin = ({ lower, upper }: RatioBounds, value: number) =>
  (lower === null || value >= lower) && (upper === null || value < upper)

const nearestWithin = (
  bounds: RatioBounds,
  preferred: number,
  decimals: number
) => {
  const rounded = onGrid(preferred, decimals)
  if (isWithin(bounds, rounded)) return rounded
  const fromLower =
    bounds.lower === null ? null : roundUp(bounds.lower, decimals)
  const fromUpper =
    bounds.upper === null ? null : lastBelow(bounds.upper, decimals)
  return [fromLower, fromUpper]
    .filter(
      (candidate): candidate is number =>
        candidate !== null && isWithin(bounds, candidate)
    )
    .toSorted(
      (first, second) =>
        Math.abs(first - preferred) - Math.abs(second - preferred)
    )[0]
}

/**
 * The ratio the include writes for a band: `preferred` — the text's own
 * ratio — rounded to four decimals when that keeps every line, else the
 * nearest value that does, with up to six decimals for a narrow range.
 * `preferred` rounded when no value does.
 */
export const ratioWithin = (bounds: RatioBounds, preferred: number): number =>
  (isEmptyRange(bounds)
    ? undefined
    : DECIMALS.map((decimals) =>
        nearestWithin(bounds, preferred, decimals)
      ).find((value) => value !== undefined)) ?? onGrid(preferred, DECIMALS[0])
