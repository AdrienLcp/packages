import { missingFeatures, textWidth } from './font-metrics.ts'
import type { ServedFace } from './served-face.ts'

/** The digits a figures face draws. */
export const DIGITS = '0123456789'

/** What separates a number's digits — a clock's colon, a decimal point or comma — which `$figure-separators` adds to the figures face. */
export const FIGURE_SEPARATORS = ':.,'

const TABULAR_FIGURES = 'tnum'

/** Under this spread, the ratios of every weight count as one: a figures face over the whole family. */
export const UNIFORM_FIGURES_SPREAD = 0.001

/** What the figures face draws, and so what its ratio is measured over. */
export const figuresText = (separators: boolean): string =>
  separators ? `${DIGITS}${FIGURE_SEPARATORS}` : DIGITS

type FaceFile = ServedFace['files'][number]

const ZERO = 0x30

const drawsDigits = ({ font }: FaceFile) => font.font.hasGlyphForCodePoint(ZERO)

const hasTabularDefaultDigits = ({ font }: FaceFile) => {
  const advances = [...DIGITS].map((digit) => textWidth(font, digit))
  return advances.every((advance) => advance === advances[0])
}

/**
 * The features of `features` a file of `face` lacks, per file: a browser sets
 * the digits without them, so a measure with them describes a text the page
 * never shows. Only the files that draw digits are read, and `tnum` passes on
 * one whose digits already share one advance.
 */
export const unsupportedFigureFeatures = (
  face: ServedFace,
  features: readonly string[]
): { file: string; features: string[] }[] =>
  face.files.filter(drawsDigits).flatMap((file) => {
    const missing = missingFeatures(file.font, features).filter(
      (feature) => feature !== TABULAR_FIGURES || !hasTabularDefaultDigits(file)
    )
    return missing.length === 0 ? [] : [{ features: missing, file: file.name }]
  })

/**
 * The one ratio every weight shares, their mean, when they spread less than
 * {@link UNIFORM_FIGURES_SPREAD}; `null` when they differ, or when none was
 * measured.
 */
export const uniformFiguresRatio = (
  ratios: readonly number[]
): number | null => {
  if (ratios.length === 0) return null
  const spread = Math.max(...ratios) / Math.min(...ratios) - 1
  return spread < UNIFORM_FIGURES_SPREAD
    ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
    : null
}
