import { Result } from '@adrienlcp/result'
import {
  blend,
  clampRgb,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  parseHex,
  type Rgb,
  useMode,
  wcagContrast
} from 'culori/fn'

/** A colour in gamma-encoded sRGB, each channel and the alpha in `[0, 1]`; no alpha means opaque. */
export type Color = Rgb

const toRgb = useMode(modeRgb)
useMode(modeLrgb)
useMode(modeOklab)
useMode(modeOklch)

const parseTokenColor = (value: string) => {
  const lowercase = value.toLowerCase()
  if (lowercase.startsWith('#')) return parseHex(lowercase)

  const color = parse(lowercase)
  return color?.mode === 'oklch' ? color : undefined
}

/**
 * Reads an `oklch()` or hex colour, the two forms a token is written in. An
 * `oklch()` outside sRGB is clipped, as a browser on an sRGB screen draws it.
 */
export const parseColor = (value: string) => {
  const color = parseTokenColor(value)
  if (!color) return Result.failure('unsupported-color')
  return Result.success(clampRgb(toRgb(color)))
}

export const isTranslucent = (color: Color) => (color.alpha ?? 1) < 1

/** Paints a translucent colour over an opaque one, blending in gamma-encoded sRGB as browsers do. */
export const composite = (top: Color, beneath: Color): Color =>
  blend([beneath, top])

/** The WCAG 2 contrast ratio of two opaque colours, from 1 to 21. */
export const contrastRatio = (first: Color, second: Color) =>
  wcagContrast(first, second)
