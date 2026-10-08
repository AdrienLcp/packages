const QUOTES = new Set(['"', "'", '`'])

const blankedOut = (text: string) => text.replace(/[^\n]/g, ' ')

const endOfString = (source: string, start: number) => {
  const quote = source.charAt(start)
  let index = start + 1
  while (index < source.length) {
    const char = source.charAt(index)
    if (char === '\\') index += 2
    else if (char === quote) return index + 1
    else if (char === '\n' && quote !== '`') return index
    else index += 1
  }
  return source.length
}

const endOf = (source: string, closing: string, from: number) => {
  const found = source.indexOf(closing, from)
  return found === -1 ? source.length : found + closing.length
}

/**
 * The source — a stylesheet or a script — with its `//` and `/* *\/` comments
 * blanked out, line breaks kept so line numbers hold. A `//` inside a string
 * or an unquoted `url()` — `url(https://…)` — is no comment.
 */
export const withoutComments = (source: string): string => {
  let result = ''
  let index = 0
  while (index < source.length) {
    const pair = source.slice(index, index + 2)
    let end = index + 1
    let blank = false
    if (QUOTES.has(source.charAt(index))) end = endOfString(source, index)
    else if (source.slice(index, index + 4).toLowerCase() === 'url(')
      end = endOf(source, ')', index)
    else if (pair === '/*') {
      end = endOf(source, '*/', index + 2)
      blank = true
    } else if (pair === '//') {
      const lineBreak = source.indexOf('\n', index)
      end = lineBreak === -1 ? source.length : lineBreak
      blank = true
    }
    const piece = source.slice(index, end)
    result += blank ? blankedOut(piece) : piece
    index = end
  }
  return result
}
