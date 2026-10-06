const SENTENCE_STOPS = new Set(['.', '!', '?'])

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
