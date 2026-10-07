/** A declaration whose size ignores the user's font size, with the line it sits on (1-based). */
export type UnitFailure = {
  declaration: string
  kind: 'pixels' | 'viewport-without-rem'
  line: number
}

const TEXT_PROPERTY = /^(font-size|font|--text-[\w-]+)$/
const SIZED_PROPERTY =
  /^(font-size|font|--text-[\w-]+|--space-[\w-]+|margin(-[\w-]+)?|padding(-[\w-]+)?|gap|row-gap|column-gap|text-indent)$/
const DECLARATION = /^\s*([\w-]+)\s*:\s*(.+?)\s*;?\s*$/
const PIXELS = /(^|[^\w.])-?\d*\.?\d+px\b/
const VIEWPORT =
  /\d(vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqi|cqb|cqw|cqh|cqmin|cqmax)\b/
const REM = /\drem\b|var\(--(text|space)-/

const checkDeclaration = (
  property: string,
  value: string
): UnitFailure['kind'] | undefined => {
  if (!SIZED_PROPERTY.test(property)) return undefined
  if (PIXELS.test(value)) return 'pixels'
  if (TEXT_PROPERTY.test(property) && VIEWPORT.test(value) && !REM.test(value))
    return 'viewport-without-rem'
  return undefined
}

/**
 * Lists every text size and spacing in a stylesheet that the user's font size
 * cannot reach: a `px` value, or a text size driven by the viewport with no
 * rem part. Reads one declaration per line, as Sass and plain CSS are written.
 * A size derived from a named unit token (`calc(var(--cu) * 4)`) passes: that
 * is how a viewport-sized surface opts out.
 */
export const findUnitFailures = (stylesheet: string): UnitFailure[] =>
  stylesheet.split('\n').flatMap((text, index) => {
    const declaration = DECLARATION.exec(text.replace(/\/\/.*$/, ''))
    if (!declaration) return []
    const [, property = '', value = ''] = declaration
    const kind = checkDeclaration(property, value)
    return kind ? [{ declaration: text.trim(), kind, line: index + 1 }] : []
  })
