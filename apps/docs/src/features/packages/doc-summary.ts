const SENTENCE_STOPS = new Set(['.', '!', '?'])
const JSDOC_LINE_PREFIX = /^\s*\*\s?/
const SASSDOC_LINE_PREFIX = /^\s*\/\/\/\s?/

const endsSentenceAt = (text: string, index: number): boolean =>
  SENTENCE_STOPS.has(text.charAt(index)) &&
  (index === text.length - 1 || /\s/.test(text.charAt(index + 1)))

/**
 * The first sentence of a doc comment, on one line: what a list of exports
 * shows beside a name. A full stop inside inline code does not end it.
 */
export const firstSentenceOf = (paragraphs: string): string | null => {
  const [firstParagraph = ''] = paragraphs.trim().split(/\n\s*\n/)
  const text = firstParagraph.replace(/\s+/g, ' ').trim()

  if (text === '') {
    return null
  }

  let isInsideCode = false

  for (let index = 0; index < text.length; index++) {
    if (text.charAt(index) === '`') {
      isInsideCode = !isInsideCode
    } else if (!isInsideCode && endsSentenceAt(text, index)) {
      return text.slice(0, index + 1)
    }
  }

  return text
}

/** The text of the `/** … *\/` block that ends right before `position`, if any. */
export const jsDocBefore = (
  source: string,
  position: number
): string | null => {
  const before = source.slice(0, position).trimEnd()

  if (!before.endsWith('*/')) {
    return null
  }

  const start = before.lastIndexOf('/**')

  if (start === -1) {
    return null
  }

  return before
    .slice(start + 3, -2)
    .split(/\r?\n/)
    .map((line) => line.replace(JSDOC_LINE_PREFIX, ''))
    .join('\n')
}

/** The text of the `///` lines right above line `lineIndex`, if any. */
export const sassDocAbove = (
  lines: readonly string[],
  lineIndex: number
): string | null => {
  const docLines: string[] = []

  for (let index = lineIndex - 1; index >= 0; index--) {
    const line = lines[index] ?? ''

    if (!SASSDOC_LINE_PREFIX.test(line)) {
      break
    }

    docLines.unshift(line.replace(SASSDOC_LINE_PREFIX, ''))
  }

  return docLines.length === 0 ? null : docLines.join('\n')
}
