/**
 * The fonts drawn on the same metrics as each one fontaine scales its fallback
 * faces to, the font itself first. Linux ships Liberation or the Chrome OS
 * fonts (Arimo, Cousine, Tinos) instead of the Microsoft ones, and Android
 * only Roboto, within 0.3 % of Arial once scaled: a fallback face that names
 * the Microsoft font alone fails to load there, text paints in an unscaled
 * system font and moves when the web font swaps in. A bold cut is named by its
 * own full and PostScript names: `local()` matches one face of a family, never
 * the family, so the bold cuts of the twins are listed under the bold one.
 */
export const METRIC_TWINS: Readonly<Record<string, readonly string[]>> = {
  Arial: ['Arial', 'Liberation Sans', 'Arimo', 'Roboto'],
  'Arial Bold': [
    'Arial Bold',
    'Arial-BoldMT',
    'Liberation Sans Bold',
    'Arimo Bold',
    'Roboto Bold'
  ],
  'Arial Bold Italic': [
    'Arial Bold Italic',
    'Arial-BoldItalicMT',
    'Liberation Sans Bold Italic',
    'Arimo Bold Italic',
    'Roboto Bold Italic'
  ],
  'Arial Italic': [
    'Arial Italic',
    'Arial-ItalicMT',
    'Liberation Sans Italic',
    'Arimo Italic',
    'Roboto Italic'
  ],
  'Courier New': ['Courier New', 'Liberation Mono', 'Cousine'],
  'Courier New Bold': [
    'Courier New Bold',
    'CourierNewPS-BoldMT',
    'Liberation Mono Bold',
    'Cousine Bold'
  ],
  'Times New Roman': ['Times New Roman', 'Liberation Serif', 'Tinos'],
  'Times New Roman Bold': [
    'Times New Roman Bold',
    'TimesNewRomanPS-BoldMT',
    'Liberation Serif Bold',
    'Tinos Bold'
  ]
}

/** The fonts each one is widened to, keyed by the font a fallback face names. */
export type MetricTwins = Readonly<Record<string, readonly string[]>>

const LONE_LOCAL_SOURCE = /^local\(\s*(["']?)(?<font>[^"')]+?)\1\s*\)$/

const byLowerCaseName = (twins: MetricTwins) =>
  new Map(
    Object.entries(twins).map(([font, faces]) => [font.toLowerCase(), faces])
  )

/**
 * The `src` of a face that names one local font with metric twins, rewritten
 * to name all of them: `local("Arial")` becomes `local("Arial"),
 * local("Liberation Sans"), local("Arimo"), local("Roboto")`. Any other
 * source — a downloaded file, a list, a font without twins — comes back as it
 * is. The font name is matched as a browser matches `local()`, ignoring case.
 */
export const withMetricTwins = (
  src: string,
  twins: MetricTwins = METRIC_TWINS
): string => {
  const font = LONE_LOCAL_SOURCE.exec(src.trim())?.groups?.font
  const faces =
    font === undefined
      ? undefined
      : byLowerCaseName(twins).get(font.toLowerCase())

  return faces === undefined
    ? src
    : faces.map((face) => `local("${face}")`).join(', ')
}
