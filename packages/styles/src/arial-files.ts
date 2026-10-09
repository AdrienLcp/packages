import { existsSync } from 'node:fs'

/** A cut of Arial, as `fonts.fallback-faces` draws one band of a family. */
export type ArialCut = 'regular' | 'bold' | 'italic' | 'bold-italic'

/**
 * Where Windows, macOS and Linux keep each cut. Liberation Sans is last: it
 * is drawn on Arial's advance widths, so it measures the same.
 */
export const ARIAL_FILES: Readonly<Record<ArialCut, readonly string[]>> = {
  bold: [
    'C:/Windows/Fonts/arialbd.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/liberation-sans/LiberationSans-Bold.ttf'
  ],
  'bold-italic': [
    'C:/Windows/Fonts/arialbi.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf',
    '/Library/Fonts/Arial Bold Italic.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial_Bold_Italic.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf',
    '/usr/share/fonts/liberation-sans/LiberationSans-BoldItalic.ttf'
  ],
  italic: [
    'C:/Windows/Fonts/ariali.ttf',
    '/System/Library/Fonts/Supplemental/Arial Italic.ttf',
    '/Library/Fonts/Arial Italic.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial_Italic.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',
    '/usr/share/fonts/liberation-sans/LiberationSans-Italic.ttf'
  ],
  regular: [
    'C:/Windows/Fonts/arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/Library/Fonts/Arial.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf'
  ]
}

/** The first file of `cut` this machine has, or `null` when it has none. */
export const findArialFile = (
  cut: ArialCut,
  candidates: readonly string[] = ARIAL_FILES[cut]
): string | null => candidates.find((path) => existsSync(path)) ?? null
