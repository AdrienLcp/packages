import { Result } from '@adrienlcp/result'

/** A colour in gamma-encoded sRGB, each channel and the alpha in `[0, 1]`. */
export type Color = {
  alpha: number
  blue: number
  green: number
  red: number
}

const OKLCH_PATTERN =
  /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg)?|none)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i
const HEX_PATTERN = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i
const FULL_OKLCH_CHROMA = 0.4

const parseAmount = (value: string, whole: number) =>
  value.endsWith('%')
    ? (Number.parseFloat(value) / 100) * whole
    : Number.parseFloat(value)

const clampUnit = (value: number) => Math.min(1, Math.max(0, value))

const encodeGamma = (linear: number) =>
  linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055

const decodeGamma = (encoded: number) =>
  encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4

/** OKLCH to sRGB through OKLab; an out-of-gamut channel is clipped, as a browser on an sRGB screen draws it. */
const fromOklch = (
  lightness: number,
  chroma: number,
  hueDegrees: number,
  alpha: number
): Color => {
  const hue = (hueDegrees * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3

  const toChannel = (linear: number) => encodeGamma(clampUnit(linear))

  return {
    alpha: clampUnit(alpha),
    blue: toChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    green: toChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    red: toChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  }
}

const parseOklch = (match: RegExpMatchArray) => {
  const [, lightness = '', chroma = '', hue = '', alpha = '1'] = match
  return fromOklch(
    parseAmount(lightness, 1),
    parseAmount(chroma, FULL_OKLCH_CHROMA),
    hue === 'none' ? 0 : Number.parseFloat(hue),
    parseAmount(alpha, 1)
  )
}

const parseHex = (digits: string): Color => {
  const full =
    digits.length <= 4
      ? [...digits].map((digit) => digit + digit).join('')
      : digits
  const channel = (index: number) =>
    Number.parseInt(full.slice(index * 2, index * 2 + 2), 16) / 255

  return {
    alpha: full.length === 8 ? channel(3) : 1,
    blue: channel(2),
    green: channel(1),
    red: channel(0)
  }
}

/** Reads an `oklch()` or hex colour, the two forms a token is written in. */
export const parseColor = (value: string) => {
  const oklch = value.match(OKLCH_PATTERN)
  if (oklch) return Result.success(parseOklch(oklch))

  const hex = value.match(HEX_PATTERN)
  if (hex?.[1]) return Result.success(parseHex(hex[1]))

  return Result.failure('unsupported-color')
}

/** Paints a translucent colour over an opaque one, blending in gamma-encoded sRGB as browsers do. */
export const composite = (top: Color, beneath: Color): Color => {
  const blend = (over: number, under: number) =>
    over * top.alpha + under * (1 - top.alpha)

  return {
    alpha: 1,
    blue: blend(top.blue, beneath.blue),
    green: blend(top.green, beneath.green),
    red: blend(top.red, beneath.red)
  }
}

const relativeLuminance = (color: Color) =>
  0.2126 * decodeGamma(color.red) +
  0.7152 * decodeGamma(color.green) +
  0.0722 * decodeGamma(color.blue)

/** The WCAG 2 contrast ratio of two opaque colours, from 1 to 21. */
export const contrastRatio = (first: Color, second: Color) => {
  const [lighter, darker] = [
    relativeLuminance(first),
    relativeLuminance(second)
  ].sort((left, right) => right - left)

  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}
