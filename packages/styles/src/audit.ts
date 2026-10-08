/** A declaration that breaks a stylesheet rule, with the line it sits on (1-based). */
export type StyleFailure<Kind extends string> = {
  declaration: string
  kind: Kind
  line: number
}

export type UnitFailure = StyleFailure<'pixels' | 'viewport-without-rem'>
export type TypeLiteral = StyleFailure<'type-literal'>
export type UnnamedValue = StyleFailure<'radius' | 'duration'>

/** A custom property read or declared under a name that breaks the shared set. */
export type TokenFailure = {
  kind: 'undeclared' | 'parallel'
  name: string
}

/**
 * The custom properties `tokens.defaults` declares, plus the palette names the
 * defaults read: an app reads them without declaring them itself.
 */
export const SHARED_TOKENS = [
  '--stroke-hair',
  '--stroke-thin',
  '--stroke-bold',
  '--hairline',
  '--hairline-strong',
  '--inset-hairline',
  '--inset-hairline-strong',
  '--outline-thick',
  '--outline-offset',
  '--ring',
  '--ring-offset',
  '--ring-inset',
  '--underline-offset',
  '--tracking-tight',
  '--icon-s',
  '--icon-m',
  '--icon-l',
  '--target',
  '--control-height',
  '--measure',
  '--transition-fast',
  '--transition-base',
  '--transition-slow',
  '--ease-out',
  '--rule',
  '--rule-strong',
  '--focus'
] as const

const PARALLEL_FAMILIES = ['control', 'outline', 'ring', 'target']

const TEXT_PROPERTY = /^(font-size|font|--text-[\w-]+)$/
const SIZED_PROPERTY =
  /^(font-size|font|margin(-[\w-]+)?|padding(-[\w-]+)?|gap|row-gap|column-gap|text-indent|((min|max)-)?(width|height|inline-size|block-size)|inset(-[\w-]+)?|top|right|bottom|left|translate|flex-basis)$/
const CUSTOM_PROPERTY = /^--[\w-]+$/
const PIXEL_TOKEN = /^--(stroke|outline|radius|shadow|target)(-[\w-]+)?$/
const TYPE_PROPERTY = /^(font-weight|line-height|letter-spacing)$/
const RADIUS_PROPERTY = /^border(-[\w-]+)?-radius$/
const MOTION_PROPERTY = /^(transition|animation)(-duration|-delay)?$/
const DECLARATION = /^\s*([\w-]+)\s*:\s*(.+?)\s*;?\s*$/
const PIXELS = /(^|[^\w.])-?\d*\.?\d+px\b/
const VIEWPORT =
  /\d(vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqi|cqb|cqw|cqh|cqmin|cqmax)\b/
const REM = /\drem\b|var\(--(text|space)-/
const LITERAL = /^(-?\.?\d|bold|bolder|lighter|normal)/
const LENGTH = /(^|[^\w.-])(\d*\.?\d+)(px|rem|em)\b/g
const TIME = /(^|[^\w.-])(\d*\.?\d+)(ms|s)\b/g
const READ_TOKEN = /var\(\s*(--[\w-]+)/g
const DECLARED_TOKEN =
  /(?:^|[^\w-])(--[\w-]+)\s*:|['"`](--[\w-]+)['"`]|@property\s+(--[\w-]+)/gm

const readDeclarations = (stylesheet: string) =>
  stylesheet.split('\n').flatMap((text, index) => {
    const declaration = DECLARATION.exec(text.replace(/\/\/.*$/, ''))
    if (!declaration) return []
    const [, property = '', value = ''] = declaration
    return [{ line: index + 1, property, text: text.trim(), value }]
  })

const hasNonZero = (value: string, unit: RegExp) =>
  [...value.matchAll(unit)].some(([, , amount]) => Number(amount) !== 0)

const isPixelBound = (property: string) =>
  SIZED_PROPERTY.test(property) ||
  TEXT_PROPERTY.test(property) ||
  (CUSTOM_PROPERTY.test(property) && !PIXEL_TOKEN.test(property))

const unitFailureKind = (
  property: string,
  value: string
): UnitFailure['kind'] | undefined => {
  if (isPixelBound(property) && PIXELS.test(value)) return 'pixels'
  if (TEXT_PROPERTY.test(property) && VIEWPORT.test(value) && !REM.test(value))
    return 'viewport-without-rem'
  return undefined
}

const unnamedValueKind = (
  property: string,
  value: string
): UnnamedValue['kind'] | undefined => {
  if (RADIUS_PROPERTY.test(property) && hasNonZero(value, LENGTH))
    return 'radius'
  if (MOTION_PROPERTY.test(property) && hasNonZero(value, TIME))
    return 'duration'
  return undefined
}

/**
 * Lists every size in a stylesheet that the user's font size cannot reach: a
 * `px` text size, spacing, box size, offset or translation, a `px` custom
 * property outside the families drawn in pixels (`--stroke-*`, `--outline-*`,
 * `--radius-*`, `--shadow-*`, `--target`), or a text size driven by the
 * viewport with no rem part. Reads one declaration per line, as Sass and plain
 * CSS are written. A size derived from a named unit token
 * (`calc(var(--cu) * 4)`) passes: that is how a viewport-sized surface opts
 * out.
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

/**
 * Lists every radius, and every transition or animation duration and delay,
 * written as a literal instead of a `--radius-*` or `--transition-*` token — a
 * literal duration is one `reduced-motion.css` cannot reach. `0` and `0s` pass,
 * and so does a token's own declaration, which is a custom property.
 */
export const findUnnamedValues = (stylesheet: string): UnnamedValue[] =>
  readDeclarations(stylesheet).flatMap(({ line, property, text, value }) => {
    const kind = unnamedValueKind(property, value)
    return kind ? [{ declaration: text, kind, line }] : []
  })

const namesIn = (sources: readonly string[], pattern: RegExp) =>
  new Set(
    sources.flatMap((source) =>
      [...source.matchAll(pattern)].flatMap(([, ...names]) =>
        names.filter((name) => name !== undefined)
      )
    )
  )

const SHARED: ReadonlySet<string> = new Set(SHARED_TOKENS)

const isParallel = (name: string) =>
  !SHARED.has(name) &&
  PARALLEL_FAMILIES.some((family) => name.startsWith(`--${family}-`))

/**
 * Lists the custom properties an app gets wrong across all its sources — the
 * stylesheets and the scripts that set a property through `style`:
 * - `undeclared`: read through `var()` yet declared nowhere and not shared, as
 *   a rename without an alias leaves it — the rule silently reads nothing;
 * - `parallel`: a second name in a family the shared set holds in one —
 *   `--control-m` beside `--control-height`, `--outline-thin` beside
 *   `--outline-thick`.
 */
export const findTokenFailures = (
  sources: readonly string[]
): TokenFailure[] => {
  const declared = namesIn(sources, DECLARED_TOKEN)
  const undeclared = [...namesIn(sources, READ_TOKEN)]
    .filter((name) => !declared.has(name) && !SHARED.has(name))
    .map((name) => ({ kind: 'undeclared' as const, name }))
  const parallel = [...declared]
    .filter(isParallel)
    .map((name) => ({ kind: 'parallel' as const, name }))
  return [...undeclared, ...parallel].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}
