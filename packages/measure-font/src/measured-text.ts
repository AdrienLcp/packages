/**
 * The text measured when the app gives none: a pangram in English and in
 * French, with digits and punctuation. Its ratios say how the font stands to
 * Arial in general, not over the app's own words.
 */
export const DEFAULT_TEXT =
  'The quick brown fox jumps over the lazy dog. Portez ce vieux whisky au juge blond qui fume : 0123456789, 12 % — « déjà vu » !'

/**
 * The text as a browser lays it out under `white-space: normal`: every run of
 * spaces, tabs and newlines one space, none at either end. A newline measured
 * raw is a glyph of its own and widens every ratio.
 */
export const collapseWhiteSpace = (text: string): string =>
  text.replace(/\s+/g, ' ').trim()

/** The text as `text-transform: uppercase` shows it, in `locale`'s rules when one is given. */
export const asShown = (
  text: string,
  { locale, uppercase }: { uppercase: boolean; locale?: string }
): string => (uppercase ? text.toLocaleUpperCase(locale) : text)
