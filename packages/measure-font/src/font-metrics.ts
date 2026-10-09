import { Result } from '@adrienlcp/result'
import { fromBuffer } from '@capsizecss/unpack'
import { create, type Font } from 'fontkit'
import wawoff2 from 'wawoff2'

/** One axis of a variable font. */
export type VariationAxis = { min: number; default: number; max: number }

/** A font file opened for measuring, decompressed when it came as `woff2`. */
export type OpenedFont = {
  /** The file as fontkit reads it at its default instance. */
  font: Font
  /** The decompressed `ttf`/`otf` bytes: what capsize, and so fontaine, measure. */
  bytes: Uint8Array
  /** Every axis of a variable font, keyed by its tag (`wght`, `wdth`); empty for a static file. */
  axes: Readonly<Record<string, VariationAxis>>
  /** The `wght` axis of a variable font; `null` when the file has none. */
  weightAxis: VariationAxis | null
  /** The weight a static file declares in its `OS/2` table, or the axis default. */
  weight: number
  italic: boolean
}

/** Where a variable font is read: its `wght`, and any other axis by tag (`{ wdth: 70 }`). */
export type Variation = {
  weight?: number
  axes?: Readonly<Record<string, number>>
}

/** A variation and the OpenType features the text is set with (`['tnum', 'lnum']`). */
export type TextStyle = Variation & { features?: readonly string[] }

/** A font's vertical metrics in em, as `fonts.fallback-faces` takes them. */
export type VerticalMetrics = {
  ascent: number
  descent: number
  capHeight: number
  /**
   * Where the capital height came from: the `OS/2` table, or the top of the
   * `H` outline when the table has none — an `OS/2` table older than version
   * 2, which is when fontaine's `readMetrics` returns `capHeight: null`.
   */
  capHeightFrom: 'OS/2' | 'H'
  /**
   * The `OS/2` typographic ascent and descent when the font sets
   * `USE_TYPO_METRICS` and they differ from `hhea`'s: a browser that honours
   * the flag draws the line box from these. `null` otherwise.
   */
  typo: { ascent: number; descent: number } | null
}

export type FontFailure = 'unreadable' | 'collection'

const WOFF2_SIGNATURE = 'wOF2'
const WEIGHT_AXIS = 'wght'
const ZERO = 0x30
const CAPITAL_H = 0x48
const FIRST_OS2_VERSION_WITH_CAP_HEIGHT = 2

const signatureOf = (bytes: Uint8Array) =>
  String.fromCharCode(...bytes.subarray(0, 4))

let previousDecompression: Promise<unknown> = Promise.resolve()

/**
 * wawoff2 hands back a view into its WebAssembly memory, which its next call
 * overwrites — even one started while the first was awaited. Calls run one at
 * a time, and each copies its bytes out before the next starts.
 */
const decompressWoff2 = (bytes: Uint8Array): Promise<Uint8Array> => {
  const decompression = previousDecompression.then(async () =>
    (await wawoff2.decompress(bytes)).slice()
  )
  previousDecompression = decompression.catch(() => undefined)
  return decompression
}

/**
 * fontkit applies a variation to a `woff2` file's tables as if they were a
 * `ttf`'s and reads garbage: the file is decompressed first.
 */
const decompressed = async (bytes: Uint8Array) =>
  signatureOf(bytes) === WOFF2_SIGNATURE ? await decompressWoff2(bytes) : bytes

const isFont = (opened: ReturnType<typeof create>): opened is Font =>
  opened.type !== 'TTC' && opened.type !== 'DFont'

const axesOf = (font: Font): Record<string, VariationAxis> =>
  Object.fromEntries(
    Object.entries(font.variationAxes).flatMap(([tag, axis]) =>
      axis === undefined
        ? []
        : [[tag, { default: axis.default, max: axis.max, min: axis.min }]]
    )
  )

/** Opens a `woff2`, `woff`, `ttf` or `otf` file; a collection is refused. */
export const openFont = async (
  file: Uint8Array
): Promise<Result<OpenedFont, FontFailure>> => {
  try {
    const bytes = await decompressed(file)
    const font = create(Buffer.from(bytes))
    if (!isFont(font)) return Result.failure('collection')
    const axes = axesOf(font)
    const weightAxis = axes[WEIGHT_AXIS] ?? null
    return Result.success({
      axes,
      bytes,
      font,
      italic: font['OS/2'].fsSelection.italic || font.italicAngle !== 0,
      weight: weightAxis?.default ?? font['OS/2'].usWeightClass,
      weightAxis
    })
  } catch {
    return Result.failure('unreadable')
  }
}

const instances = new WeakMap<Font, Map<string, Font>>()

const settingsFor = (opened: OpenedFont, { axes = {}, weight }: Variation) =>
  Object.fromEntries(
    Object.entries({ ...axes, [WEIGHT_AXIS]: weight }).flatMap(
      ([tag, value]) =>
        value === undefined || opened.axes[tag] === undefined
          ? []
          : [[tag, value]]
    )
  )

const cachedInstancesOf = (font: Font) => {
  const cached = instances.get(font) ?? new Map<string, Font>()
  instances.set(font, cached)
  return cached
}

/**
 * The font read at `variation`, on the axes it has: a static file, or an axis
 * the file lacks, is read as it is. Instances are kept, since a text split
 * across subsets reads the same one run after run.
 */
export const atVariation = (
  opened: OpenedFont,
  variation: Variation = {}
): Font => {
  const settings = settingsFor(opened, variation)
  if (Object.keys(settings).length === 0) return opened.font
  const key = JSON.stringify(Object.entries(settings).toSorted())
  const cached = cachedInstancesOf(opened.font)
  const instance = cached.get(key) ?? opened.font.getVariation(settings)
  cached.set(key, instance)
  return instance
}

/**
 * The width of `text` in em, shaped and kerned as a browser sets it, at the
 * variation and with the OpenType features of `style` — `tnum` and `lnum` for
 * `tabular-nums lining-nums`. A static file is measured as it is: its weight
 * is the file's own.
 */
export const textWidth = (
  opened: OpenedFont,
  text: string,
  { features = [], ...variation }: TextStyle = {}
): number => {
  const font = atVariation(opened, variation)
  return font.layout(text, [...features]).advanceWidth / font.unitsPerEm
}

/**
 * The advance of the zero in em — what one `ch` is in this font at
 * `variation`, so `n ch` converts to `n × zeroWidth` em.
 */
export const zeroWidth = (
  opened: OpenedFont,
  variation: Variation = {}
): number => {
  const font = atVariation(opened, variation)
  return font.glyphForCodePoint(ZERO).advanceWidth / font.unitsPerEm
}

/** The OpenType features of `features` the file holds no lookup for. */
export const missingFeatures = (
  { font }: OpenedFont,
  features: readonly string[]
): string[] =>
  features.filter((feature) => !font.availableFeatures.includes(feature))

const typoMetricsOf = (font: Font) => {
  const os2 = font['OS/2']
  const differsFromHhea =
    os2.typoAscender !== font.ascent ||
    Math.abs(os2.typoDescender) !== Math.abs(font.descent)
  return os2.fsSelection.useTypoMetrics && differsFromHhea
    ? {
        ascent: os2.typoAscender / font.unitsPerEm,
        descent: Math.abs(os2.typoDescender) / font.unitsPerEm
      }
    : null
}

/** Ascent and descent from `hhea`, as fontaine reads them, and the capital height. */
export const verticalMetrics = ({ font }: OpenedFont): VerticalMetrics => {
  const os2 = font['OS/2']
  const fromTable =
    os2.version >= FIRST_OS2_VERSION_WITH_CAP_HEIGHT && os2.capHeight > 0
  const capHeight = fromTable
    ? os2.capHeight
    : font.glyphForCodePoint(CAPITAL_H).bbox.maxY
  return {
    ascent: font.ascent / font.unitsPerEm,
    capHeight: capHeight / font.unitsPerEm,
    capHeightFrom: fromTable ? 'OS/2' : 'H',
    descent: Math.abs(font.descent) / font.unitsPerEm,
    typo: typoMetricsOf(font)
  }
}

const averageWidth = async ({ bytes }: OpenedFont) => {
  const metrics = await fromBuffer(Buffer.from(bytes))
  return metrics.xWidthAvg / metrics.unitsPerEm
}

/**
 * The `size-adjust` fontaine computes for `font` over `fallback`: the ratio of
 * their average character widths, weighted by letter frequency, each read at
 * its default instance. fontaine reads a family it finds in capsize's metrics
 * collection — every Google font — from that collection rather than from the
 * file, so the value in the built CSS can differ in the fourth decimal: pass
 * that one when it does.
 */
export const fontaineSizeAdjust = async (
  font: OpenedFont,
  fallback: OpenedFont
): Promise<number> =>
  (await averageWidth(font)) / (await averageWidth(fallback))
