/** A declaration that breaks a stylesheet rule, with the line it sits on (1-based). */
export type StyleFailure<Kind extends string> = {
  declaration: string
  kind: Kind
  line: number
}

export type UnitFailure = StyleFailure<'pixels' | 'viewport-without-rem'>
export type TypeLiteral = StyleFailure<'type-literal'>

const TEXT_PROPERTY = /^(font-size|font|--text-[\w-]+)$/
const SIZED_PROPERTY =
  /^(font-size|font|--text-[\w-]+|--space-[\w-]+|margin(-[\w-]+)?|padding(-[\w-]+)?|gap|row-gap|column-gap|text-indent)$/
const TYPE_PROPERTY = /^(font-weight|line-height|letter-spacing)$/
const DECLARATION = /^\s*([\w-]+)\s*:\s*(.+?)\s*;?\s*$/
const PIXELS = /(^|[^\w.])-?\d*\.?\d+px\b/
const VIEWPORT =
  /\d(vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqi|cqb|cqw|cqh|cqmin|cqmax)\b/
const REM = /\drem\b|var\(--(text|space)-/
const LITERAL = /^(-?\.?\d|bold|bolder|lighter|normal)/

const readDeclarations = (stylesheet: string) =>
  stylesheet.split('\n').flatMap((text, index) => {
    const declaration = DECLARATION.exec(text.replace(/\/\/.*$/, ''))
    if (!declaration) return []
    const [, property = '', value = ''] = declaration
    return [{ line: index + 1, property, text: text.trim(), value }]
  })

const unitFailureKind = (
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
  readDeclarations(stylesheet).flatMap(({ line, property, text, value }) => {
    const kind = unitFailureKind(property, value)
    return kind ? [{ declaration: text, kind, line }] : []
  })

/**
 * Lists every `font-weight`, `line-height` and `letter-spacing` written as a
 * literal. A text voice lives in the typography mixins, so run this on every
 * stylesheet but the one that declares them.
 */
export const findTypeLiterals = (stylesheet: string): TypeLiteral[] =>
  readDeclarations(stylesheet).flatMap(({ line, property, text, value }) =>
    TYPE_PROPERTY.test(property) && LITERAL.test(value)
      ? [{ declaration: text, kind: 'type-literal' as const, line }]
      : []
  )
