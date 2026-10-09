import { rounded, SIZE_ADJUST_DECIMALS } from './decimals.ts'
import type { FallbackMeasure } from './fallback-measure.ts'

/** How the include is written beyond what the measure holds. */
export type IncludeOptions = {
  /** Writes `$style: italic`, for the italic files. */
  italic?: boolean
  /** Writes `$figure-separators: true`: the figures face also draws `: . ,`. */
  figureSeparators?: boolean
}

const WIDTH_AXIS = 'wdth'

const mapOf = (entries: readonly string[]) => `(${entries.join(', ')})`

const figuresArgument = ({ uniformFigures, weights }: FallbackMeasure) => {
  if (uniformFigures !== null) return `$figures: ${rounded(uniformFigures)}`
  const entries = weights.flatMap(({ figures, weight }) =>
    figures === null ? [] : [`${weight}: ${rounded(figures)}`]
  )
  return entries.length === 0 ? null : `$figures: ${mapOf(entries)}`
}

const figureArguments = (
  measure: FallbackMeasure,
  { figureSeparators = false }: IncludeOptions
) => {
  const figures = figuresArgument(measure)
  if (figures === null) return []
  return figureSeparators ? [figures, '$figure-separators: true'] : [figures]
}

const stretchArgument = ({ axes }: FallbackMeasure) => {
  const stretch = axes[WIDTH_AXIS]
  return stretch === undefined ? [] : [`$stretch: ${stretch}%`]
}

const metricsArgument = ({ metrics }: FallbackMeasure) =>
  `(ascent: ${rounded(metrics.ascent)}, descent: ${rounded(metrics.descent)}, cap-height: ${rounded(metrics.capHeight)})`

const UNSCALED = 1

const widthsArguments = (measure: FallbackMeasure) => {
  const widths = mapOf(
    measure.weights.flatMap(({ weight, written }) =>
      written === null ? [] : [`${weight}: ${written}`]
    )
  )
  return measure.sizeAdjust === UNSCALED
    ? [`$widths: ${widths}`]
    : [`${rounded(measure.sizeAdjust, SIZE_ADJUST_DECIMALS)}`, widths]
}

/**
 * The `fonts.fallback-faces` include for a measure, one `$widths` entry per
 * weight measured: widen each weight to the band of weights it stands for.
 * A `size-adjust` of 1 is left to the mixin's default. Under `figuresOnly`,
 * the `$figures` argument alone, to add to an include written before.
 */
export const fallbackFacesInclude = (
  family: string,
  measure: FallbackMeasure,
  options: IncludeOptions = {}
): string => {
  const figures = figureArguments(measure, options)
  if (measure.figuresOnly) return figures.join(', ')
  const style = options.italic === true ? ['$style: italic'] : []
  const argumentList = [
    `'${family}'`,
    metricsArgument(measure),
    ...widthsArguments(measure),
    ...figures,
    ...stretchArgument(measure),
    ...style
  ]
  return `@include fonts.fallback-faces(${argumentList.join(', ')})`
}
