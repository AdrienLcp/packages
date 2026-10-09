import { Result } from '@adrienlcp/result'

import { rounded } from './decimals.ts'
import {
  figuresText,
  uniformFiguresRatio,
  unsupportedFigureFeatures
} from './figures.ts'
import {
  fontaineSizeAdjust,
  type OpenedFont,
  textWidth,
  type Variation,
  type VerticalMetrics,
  verticalMetrics,
  zeroWidth
} from './font-metrics.ts'
import {
  type EdgeLine,
  lineBound,
  type RatioBounds,
  ratioBounds,
  ratioWithin
} from './line-bounds.ts'
import { collapseWhiteSpace } from './measured-text.ts'
import {
  type Coverage,
  coverageOf,
  type ServedFace,
  servedTextWidth
} from './served-face.ts'

/** How the digits are measured for a figures face of their own. */
export type FiguresInput = {
  /** The OpenType features they are set with — `tnum` and `lnum` for `tabular-nums lining-nums`. */
  features: readonly string[]
  /** Measures `: . ,` with the digits, for `$figure-separators`. */
  separators: boolean
  /** Measures the digits alone, without the text's `$widths`. */
  only: boolean
}

/** What `measureFallbackFaces` measures a family against. */
export type FallbackMeasureInput = {
  /** The family's faces; the first file of the first is the one fontaine measures. */
  faces: readonly ServedFace[]
  /** Arial and Arial Bold — or their italic cuts, for the italic files. */
  regular: OpenedFont
  bold: OpenedFont
  /** The app's own text. */
  text: string
  /** The weights a variable face is measured at; a static face is measured at its own. */
  weights: readonly number[]
  /** Every other axis a variable face is read at, by tag: `{ wdth: 70 }`. */
  axes?: Readonly<Record<string, number>>
  /** From this weight up, the band is drawn in `bold` (650, as `fallback-faces`). */
  boldFrom: number
  /** The `size-adjust` in the built CSS; fontaine's own computation from the first file when left out. */
  sizeAdjust?: number
  /** Ascent and descent in em, given by hand over the font's own. */
  metrics?: { ascent?: number; descent?: number }
  /** Measures the digits apart, for a figures face of their own. */
  figures?: FiguresInput
  /** Lines at the edge of their box, which each band's ratio must keep wrapped as the web font wraps them. */
  lines?: readonly EdgeLine[]
}

/** One weight of one face. */
export type WeightMeasure = {
  face: string
  weight: number
  /** The zero's advance in em at this weight: what one `ch` is. */
  zero: number
  /** The text's own ratio; `null` when only the digits were measured. */
  ratio: number | null
  /** The `$widths` entry: `ratio` rounded, or moved into `bounds`. */
  written: number | null
  /** The `$figures` entry for this weight, when the digits were measured. */
  figures: number | null
  /** The digits' ratio set without features, to compare with the letters'. */
  plainFigures: number
  /** What the edge lines at this weight allow; `null` without any. */
  bounds: RatioBounds | null
  /** The full name of the Arial cut the ratio is over. */
  fallback: string
}

export type FallbackMeasure = {
  weights: WeightMeasure[]
  metrics: VerticalMetrics
  /** The metrics given by hand rather than read from the font. */
  givenMetrics: readonly ('ascent' | 'descent')[]
  sizeAdjust: number
  sizeAdjustFrom: 'given' | 'first-file'
  /** The axes the faces were read at besides `wght`. */
  axes: Readonly<Record<string, number>>
  /** The one `$figures` ratio every weight shares, when they do. */
  uniformFigures: number | null
  /** The text's characters no file draws, left out of every width. */
  missing: readonly string[]
  /** The files that draw none of the text, measured through their subsets. */
  unused: readonly string[]
  figuresOnly: boolean
}

/** Why a family could not be measured. */
export type MeasureFailure =
  | { reason: 'empty-text' }
  | { reason: 'no-face' }
  | { reason: 'no-glyph'; face: string; text: 'text' | 'figures' }
  | { reason: 'missing-feature'; file: string; features: readonly string[] }
  | { reason: 'missing-axis'; face: string; axis: string }
  | { reason: 'duplicate-weight'; weight: number; faces: readonly string[] }
  | { reason: 'unmeasured-line-weight'; weight: number }

const WEIGHT_AXIS = 'wght'

const weightsOf = (face: ServedFace, weights: readonly number[]) =>
  face.weightAxis === null || weights.length === 0 ? [face.weight] : weights

type Band = { face: ServedFace; weight: number }

const bandsOf = (
  faces: readonly ServedFace[],
  weights: readonly number[]
): Band[] =>
  faces.flatMap((face) =>
    weightsOf(face, weights).map((weight) => ({ face, weight }))
  )

const firstFailure = <T>(
  checks: readonly (() => T | undefined)[]
): T | undefined => {
  for (const check of checks) {
    const failure = check()
    if (failure !== undefined) return failure
  }
  return undefined
}

const missingAxis = (
  faces: readonly ServedFace[],
  axes: Readonly<Record<string, number>>
): MeasureFailure | undefined => {
  for (const face of faces)
    for (const axis of Object.keys(axes))
      if (axis !== WEIGHT_AXIS && face.axes[axis] === undefined)
        return { axis, face: face.name, reason: 'missing-axis' }
  return undefined
}

const duplicateWeight = (bands: readonly Band[]): MeasureFailure | undefined =>
  [...Map.groupBy(bands, ({ weight }) => weight)]
    .filter(([, sharing]) => sharing.length > 1)
    .map(
      ([weight, sharing]): MeasureFailure => ({
        faces: sharing.map(({ face }) => face.name),
        reason: 'duplicate-weight',
        weight
      })
    )[0]

const uncovered = (
  faces: readonly ServedFace[],
  coverages: ReadonlyMap<ServedFace, Coverage>,
  text: 'text' | 'figures'
): MeasureFailure | undefined => {
  const face = faces.find((each) => coverages.get(each)?.drawn === '')
  return face === undefined
    ? undefined
    : { face: face.name, reason: 'no-glyph', text }
}

const unsupportedFeature = (
  faces: readonly ServedFace[],
  features: readonly string[]
): MeasureFailure | undefined => {
  const [gap] = faces.flatMap((face) =>
    unsupportedFigureFeatures(face, features)
  )
  return gap === undefined ? undefined : { ...gap, reason: 'missing-feature' }
}

const lineWeightOutside = (
  lines: readonly EdgeLine[],
  bands: readonly Band[]
): MeasureFailure | undefined => {
  const line = lines.find(
    ({ weight }) =>
      weight !== undefined && !bands.some((band) => band.weight === weight)
  )
  return line?.weight === undefined
    ? undefined
    : { reason: 'unmeasured-line-weight', weight: line.weight }
}

const coveragesOf = (faces: readonly ServedFace[], text: string) =>
  new Map(faces.map((face) => [face, coverageOf(face, text)]))

const unique = (values: readonly string[]) => [...new Set(values)]

const measuredMetrics = (
  font: OpenedFont,
  { ascent, descent }: NonNullable<FallbackMeasureInput['metrics']> = {}
): VerticalMetrics => {
  const read = verticalMetrics(font)
  return {
    ...read,
    ascent: ascent ?? read.ascent,
    descent: descent ?? read.descent
  }
}

/**
 * Measures a family for `fonts.fallback-faces`: its vertical metrics from the
 * first file, the `size-adjust` fontaine gives every face, and per weight the
 * zero's advance, the width ratio over the Arial cut that band is drawn in,
 * the ratio range its edge lines allow, and the digits' own ratio. A face
 * served as `unicode-range` subsets is measured as a browser draws it, each
 * character from the subset that has it. Static faces — one per weight — are
 * each measured at their own weight against the first file's `size-adjust`,
 * which fontaine copies to them all.
 */
export const measureFallbackFaces = async ({
  axes = {},
  bold,
  boldFrom,
  faces,
  figures,
  lines = [],
  metrics: givenMetrics,
  regular,
  sizeAdjust: givenSizeAdjust,
  text,
  weights
}: FallbackMeasureInput): Promise<Result<FallbackMeasure, MeasureFailure>> => {
  const [first] = faces
  const firstFile = first?.files[0]
  if (first === undefined || firstFile === undefined)
    return Result.failure({ reason: 'no-face' })
  const figuresOnly = figures?.only === true
  const measured = collapseWhiteSpace(text)
  if (measured === '' && !figuresOnly)
    return Result.failure({ reason: 'empty-text' })

  const bands = bandsOf(faces, weights)
  const textCoverages = coveragesOf(faces, measured)
  const digits = figuresText(figures?.separators === true)
  const figureCoverages = coveragesOf(faces, digits)
  const failure = firstFailure<MeasureFailure>([
    () => missingAxis(faces, axes),
    () => duplicateWeight(bands),
    () => (figuresOnly ? undefined : uncovered(faces, textCoverages, 'text')),
    () => uncovered(faces, figureCoverages, 'figures'),
    () => unsupportedFeature(faces, figures?.features ?? []),
    () => lineWeightOutside(lines, bands)
  ])
  if (failure !== undefined) return Result.failure(failure)

  const sizeAdjust =
    givenSizeAdjust ?? (await fontaineSizeAdjust(firstFile.font, regular))
  const firstWeight = bands[0]?.weight
  const measureBand = ({ face, weight }: Band): WeightMeasure => {
    const fallback = weight >= boldFrom ? bold : regular
    const variation: Variation = { axes, weight }
    const drawn = textCoverages.get(face)?.drawn ?? ''
    const drawnDigits = figureCoverages.get(face)?.drawn ?? digits
    const ratioOver = (over: string, features: readonly string[] = []) =>
      (textWidth(fallback, over, { features }) * sizeAdjust) /
      servedTextWidth(face, over, { ...variation, features })
    const ratio = figuresOnly ? null : ratioOver(drawn)
    const bandLines = lines.filter(
      (line) => (line.weight ?? firstWeight) === weight
    )
    const bounds =
      bandLines.length === 0
        ? null
        : ratioBounds(
            bandLines.flatMap((line) => {
              const bound = lineBound({
                face,
                fallback,
                line,
                sizeAdjust,
                variation
              })
              return bound === null ? [] : [bound]
            })
          )
    return {
      bounds,
      face: face.name,
      fallback: fallback.font.fullName,
      figures:
        figures === undefined ? null : ratioOver(drawnDigits, figures.features),
      plainFigures: ratioOver(drawnDigits),
      ratio,
      weight,
      written:
        ratio === null
          ? null
          : bounds === null
            ? rounded(ratio)
            : ratioWithin(bounds, ratio),
      zero: zeroWidth(face.files[0]?.font ?? firstFile.font, variation)
    }
  }
  const measures = bands.map(measureBand)
  const coverages = figuresOnly ? [] : [...textCoverages.values()]
  return Result.success({
    axes,
    figuresOnly,
    givenMetrics: (['ascent', 'descent'] as const).filter(
      (edge) => givenMetrics?.[edge] !== undefined
    ),
    metrics: measuredMetrics(firstFile.font, givenMetrics),
    missing: unique(coverages.flatMap(({ missing }) => missing)),
    sizeAdjust,
    sizeAdjustFrom: givenSizeAdjust === undefined ? 'first-file' : 'given',
    uniformFigures: uniformFiguresRatio(
      measures.flatMap(({ figures }) => (figures === null ? [] : [figures]))
    ),
    unused: unique(coverages.flatMap(({ unused }) => unused)),
    weights: measures
  })
}
