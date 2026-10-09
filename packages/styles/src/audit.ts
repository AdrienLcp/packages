import { withoutComments } from './source-comments.ts'

/** A declaration that breaks a stylesheet rule, with the line it sits on (1-based). */
export type StyleFailure<Kind extends string> = {
  declaration: string
  kind: Kind
  line: number
}

export type UnitFailure = StyleFailure<
  'pixels' | 'viewport-without-rem' | 'ch' | 'fractional-outline'
>
export type TypeLiteral = StyleFailure<'type-literal'>
export type UnnamedValue = StyleFailure<'radius' | 'duration' | 'text-size'>
/** A font token naming a web font that fontaine's fallback face never follows. */
export type FallbackFailure = StyleFailure<'missing-fallback'> & {
  family: string
}

/** A custom property read or declared under a name that breaks the shared set. */
export type TokenFailure = {
  kind: 'undeclared' | 'parallel' | 'alias'
  name: string
}

/** What a project's sources rely on beyond their own declarations. */
export type TokenAuditOptions = {
  /**
   * Names a library sets at runtime and the sources only read — react-aria's
   * `--trigger-width`, for one: `REACT_ARIA_TOKENS` from `@adrienlcp/react-aria`.
   */
  provided?: readonly string[]
}

/** Every custom property `tokens.defaults` declares, with the value it declares. */
export const SHARED_TOKEN_DEFAULTS = {
  '--control-height': 'max(var(--target), 2.75rem)',
  '--ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--gutter': '1rem',
  '--gutter-left': 'max(var(--gutter), var(--safe-area-left))',
  '--gutter-right': 'max(var(--gutter), var(--safe-area-right))',
  '--hairline':
    'var(--stroke-hair) solid var(--rule, color-mix(in oklab, currentColor 25%, transparent))',
  '--hairline-strong':
    'var(--stroke-hair) solid var(--rule-strong, color-mix(in oklab, currentColor 55%, transparent))',
  '--icon-l': '1.5rem',
  '--icon-m': '1.25rem',
  '--icon-s': '1rem',
  '--inset-hairline':
    'inset 0 0 0 var(--stroke-hair) var(--rule, color-mix(in oklab, currentColor 25%, transparent))',
  '--inset-hairline-strong':
    'inset 0 0 0 var(--stroke-hair) var(--rule-strong, color-mix(in oklab, currentColor 55%, transparent))',
  '--measure': '34em',
  '--outline-offset': '3px',
  '--outline-thick': '2px',
  '--ring': 'var(--outline-thick) solid var(--focus, currentColor)',
  '--ring-inset': 'calc(-1 * var(--outline-thick))',
  '--ring-offset': 'var(--outline-offset)',
  '--safe-area-bottom':
    'env(safe-area-max-inset-bottom, env(safe-area-inset-bottom, 0px))',
  '--safe-area-left': 'env(safe-area-inset-left, 0px)',
  '--safe-area-right': 'env(safe-area-inset-right, 0px)',
  '--safe-area-top': 'env(safe-area-inset-top, 0px)',
  '--stroke-bold': '2px',
  '--stroke-hair': '1px',
  '--stroke-thin': '1.5px',
  '--target': '44px',
  '--tracking-tight': '-0.02em',
  '--transition-base': '250ms',
  '--transition-fast': '150ms',
  '--transition-slow': '400ms',
  '--underline-offset': '0.24em'
} as const

type DefaultToken = keyof typeof SHARED_TOKEN_DEFAULTS

const DEFAULT_TOKENS = Object.keys(SHARED_TOKEN_DEFAULTS).filter(
  (name): name is DefaultToken => name in SHARED_TOKEN_DEFAULTS
)

/**
 * The custom properties `tokens.defaults` declares, plus the palette names the
 * defaults read: an app reads them without declaring them itself.
 */
export const SHARED_TOKENS: readonly string[] = [
  ...DEFAULT_TOKENS,
  '--rule',
  '--rule-strong',
  '--focus'
]

const PARALLEL_FAMILIES = ['control', 'outline', 'ring', 'target']
const SIZE_SUFFIX =
  /^(\d*x[sl]|s|m|l|sm|md|lg|small|medium|large|big|tiny|mini|thin|thick|touch|dense|compact|tall|short|wide|narrow)$/
const BARE_LENGTH = /^-?\d*\.?\d+[a-z]+$/

const TEXT_PROPERTY = /^(font-size|font|--text-[\w-]+)$/
const SIZED_PROPERTY =
  /^(font-size|font|margin(-[\w-]+)?|padding(-[\w-]+)?|gap|row-gap|column-gap|text-indent|((min|max)-)?(width|height|inline-size|block-size)|inset(-[\w-]+)?|top|right|bottom|left|translate|flex-basis)$/
const CUSTOM_PROPERTY = /^--[\w-]+$/
const PIXEL_TOKEN = /^--(stroke|outline|radius|shadow|target)(-[\w-]+)?$/
const TYPE_PROPERTY = /^(font-weight|line-height|letter-spacing)$/
const RADIUS_PROPERTY = /^border(-[\w-]+)?-radius$/
const MOTION_PROPERTY = /^(transition|animation)(-duration|-delay)?$/
const DECLARATION = /^\s*([\w-]+)\s*:\s*(.+?)\s*;?\s*$/
const PIXELS = /(^|[^\w.])-?(\d*\.?\d+)px\b/g
const CH = /(^|[^\w.-])(\d*\.?\d+)ch\b/g
const FRACTIONAL_PIXELS = /(^|[^\w.])\d*\.\d*[1-9]\d*px\b/
const OUTLINE_WIDTH = /^(outline|outline-width|--outline-(?!offset\b)[\w-]+)$/
const TRANSLATE_FUNCTION = /\btranslate(?:X|Y|Z|3d)?\(/g
const VIEWPORT =
  /\d(vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqi|cqb|cqw|cqh|cqmin|cqmax)\b/
const REM = /\drem\b|var\(--(text|space)-/
const LITERAL = /^(-?\.?\d|bold|bolder|lighter|normal)/
const PARENT_FONT_SIZE = /^(1em|100%)$/
const LENGTH = /(^|[^\w.-])(\d*\.?\d+)(px|rem|em)\b/g
const TIME = /(^|[^\w.-])(\d*\.?\d+)(ms|s)\b/g

/** A name written out whole: not cut short by `#{…}` or `${…}`, not ending in `-`. */
const STATIC_NAME = String.raw`(--[\w-]*\w)(?![\w-]|[#$]\{)`
const READ_TOKEN = new RegExp(String.raw`var\(\s*${STATIC_NAME}`, 'g')
const DECLARED_TOKEN = new RegExp(
  String.raw`(?:^|[^\w-])${STATIC_NAME}\s*:|['"\x60]${STATIC_NAME}['"\x60]|@property\s+${STATIC_NAME}`,
  'gm'
)
const TOKEN_DECLARATION = /^\s*(--[\w-]+)\s*:\s*(.+?)\s*;?\s*$/gm
const DISTINCTIVE_VALUE = /[\s(,]/
const FONT_FACE_INCLUDE = /(?<![@\w-])font-face\(\s*(['"])(.+?)\1/g
const FONT_FACE_RULE = /@font-face\b/g
const FONT_FACE_FAMILY =
  /(?:^|[;{\s])font-family\s*:\s*(['"]?)([^'";\n}]+?)\1\s*(?:;|\}|$)/m
const URL_SOURCE = /\bsrc\s*:[^;}]*\burl\(/
const INTERPOLATED = /[#$]\{|^\$/
const FALLBACK_SUFFIX = ' fallback'

const readDeclarations = (stylesheet: string) => {
  const lines = stylesheet.split('\n')
  return withoutComments(stylesheet)
    .split('\n')
    .flatMap((code, index) => {
      const declaration = DECLARATION.exec(code)
      if (!declaration) return []
      const [, property = '', value = ''] = declaration
      const text = (lines[index] ?? code).trim()
      return [{ line: index + 1, property, text, value }]
    })
}

const hasNonZero = (value: string, unit: RegExp) =>
  [...value.matchAll(unit)].some(([, , amount]) => Number(amount) !== 0)

const isPixelBound = (property: string) =>
  SIZED_PROPERTY.test(property) ||
  TEXT_PROPERTY.test(property) ||
  (CUSTOM_PROPERTY.test(property) && !PIXEL_TOKEN.test(property))

/** The arguments of each `translate*()` in a value, nested parentheses included. */
const translateArguments = (value: string) =>
  [...value.matchAll(TRANSLATE_FUNCTION)].map(({ 0: opening, index }) => {
    const start = index + opening.length
    let depth = 1
    let end = start
    while (end < value.length && depth > 0) {
      if (value.charAt(end) === '(') depth += 1
      if (value.charAt(end) === ')') depth -= 1
      end += 1
    }
    return value.slice(start, end)
  })

const translatesInPixels = (property: string, value: string) =>
  property === 'transform' &&
  translateArguments(value).some((args) => hasNonZero(args, PIXELS))

const unitFailureKind = (
  property: string,
  value: string
): UnitFailure['kind'] | undefined => {
  if (isPixelBound(property) && hasNonZero(value, PIXELS)) return 'pixels'
  if (translatesInPixels(property, value)) return 'pixels'
  if (TEXT_PROPERTY.test(property) && VIEWPORT.test(value) && !REM.test(value))
    return 'viewport-without-rem'
  if (
    (SIZED_PROPERTY.test(property) || CUSTOM_PROPERTY.test(property)) &&
    hasNonZero(value, CH)
  )
    return 'ch'
  if (OUTLINE_WIDTH.test(property) && FRACTIONAL_PIXELS.test(value))
    return 'fractional-outline'
  return undefined
}

const isLiteralTextSize = (property: string, value: string) =>
  property === 'font-size' &&
  !value.includes('var(') &&
  /\d/.test(value) &&
  !PARENT_FONT_SIZE.test(value)

const unnamedValueKind = (
  property: string,
  value: string
): UnnamedValue['kind'] | undefined => {
  if (RADIUS_PROPERTY.test(property) && hasNonZero(value, LENGTH))
    return 'radius'
  if (MOTION_PROPERTY.test(property) && hasNonZero(value, TIME))
    return 'duration'
  if (isLiteralTextSize(property, value)) return 'text-size'
  return undefined
}

/**
 * Lists every size in a stylesheet that the user's font size cannot reach: a
 * `px` text size, spacing, box size, offset or translation — a `transform`'s
 * `translate*()` included —, a `px` custom property outside the families
 * drawn in pixels (`--stroke-*`, `--outline-*`, `--radius-*`, `--shadow-*`,
 * `--target`), a text size driven by the viewport with no rem part (each
 * `pixels` or `viewport-without-rem`), a size or a custom property in `ch`
 * (`ch`) — the width of the font's zero, which the fallback face and the web
 * font draw differently, so the box changes when one replaces the other —, or
 * an outline width that is not a whole number of pixels (`fractional-outline`)
 * — Chromium draws an outline in whole device pixels, so a `2.5px` ring is
 * `2px` on a 1x screen. Reads
 * one declaration per line, as Sass and plain CSS are written; comments are
 * not read. A zero passes in any unit, and so does a size derived from a named
 * unit token (`calc(var(--cu) * 4)`): that is how a viewport-sized surface
 * opts out.
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
 * Lists every radius (`radius`), every transition or animation duration and
 * delay (`duration`) and every `font-size` (`text-size`) written as a literal
 * instead of a `--radius-*`, `--transition-*` or `--text-*` token — a literal
 * duration is one `reduced-motion.css` cannot reach. `0` and `0s` pass, and so
 * does a token's own declaration, which is a custom property. A font size
 * passes when it reads a `var()` (`max(var(--text-s), 7cqi)`,
 * `calc(var(--cu) * 4)`), is a keyword, or keeps the parent's size (`1em`,
 * `100%`).
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

const normalized = (value: string) => value.replace(/\s+/g, ' ').trim()

const SHARED_BY_VALUE: ReadonlyMap<string, string> = new Map(
  Object.entries(SHARED_TOKEN_DEFAULTS)
    .filter(([, value]) => DISTINCTIVE_VALUE.test(value))
    .map(([name, value]) => [normalized(value), name])
)

const declaredValues = (sources: readonly string[]) =>
  sources.flatMap((source) =>
    [...source.matchAll(TOKEN_DECLARATION)].map(
      ([, name = '', value = '']) => ({
        name,
        value: normalized(value)
      })
    )
  )

const familySuffix = (name: string) => {
  const family = PARALLEL_FAMILIES.find((candidate) =>
    name.startsWith(`--${candidate}-`)
  )
  return family === undefined ? undefined : name.slice(family.length + 3)
}

const isParallel = (name: string, values: readonly string[]) => {
  if (SHARED.has(name)) return false
  const suffix = familySuffix(name)
  if (suffix === undefined) return false
  return (
    SIZE_SUFFIX.test(suffix) || values.some((value) => BARE_LENGTH.test(value))
  )
}

/**
 * Lists the custom properties an app gets wrong across all its sources — the
 * stylesheets and the scripts that set a property through `style`. Comments
 * are not read, nor a name built by interpolation (`--g#{$n}`, `--pawn-${n}`):
 * - `undeclared`: read through `var()` yet declared nowhere, not shared and
 *   not `provided`, as a rename without an alias leaves it — the rule silently
 *   reads nothing;
 * - `parallel`: a second size in a family the shared set holds in one — a
 *   name whose suffix is a size step or a size word (`--control-m`,
 *   `--control-touch`, `--outline-thin`), or whose value is a bare length. A
 *   name derived from the family (`--target-reach`) or naming something else
 *   (`--control-ink`) passes;
 * - `alias`: a second name for a `tokens.defaults` value, declared with the
 *   very value a shared token holds (`--timing: cubic-bezier(0.16, 1, 0.3, 1)`
 *   is `--ease-out`). Only a value with a space, a comma or a function is
 *   distinctive enough to compare; a lone `1px` is anyone's.
 */
export const findTokenFailures = (
  sources: readonly string[],
  { provided = [] }: TokenAuditOptions = {}
): TokenFailure[] => {
  const code = sources.map(withoutComments)
  const declared = namesIn(code, DECLARED_TOKEN)
  const values = declaredValues(code)
  const known = new Set([...declared, ...SHARED, ...provided])
  const undeclared = [...namesIn(code, READ_TOKEN)]
    .filter((name) => !known.has(name))
    .map((name) => ({ kind: 'undeclared' as const, name }))
  const parallel = [...declared]
    .filter((name) =>
      isParallel(
        name,
        values.filter((entry) => entry.name === name).map(({ value }) => value)
      )
    )
    .map((name) => ({ kind: 'parallel' as const, name }))
  const aliases = new Set(
    values
      .filter(({ name, value }) => {
        const shared = SHARED_BY_VALUE.get(value)
        return shared !== undefined && shared !== name
      })
      .map(({ name }) => name)
  )
  const alias = [...aliases].map((name) => ({ kind: 'alias' as const, name }))
  return [...undeclared, ...parallel, ...alias].sort(
    (a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind)
  )
}

const indentOf = (line: string) => line.length - line.trimStart().length

/** The body of the `@font-face` at `start`: braces in CSS, deeper lines in indented Sass. */
const fontFaceBody = (source: string, start: number) => {
  const lineStart = source.lastIndexOf('\n', start) + 1
  const headerEnd = source.indexOf('\n', start)
  const header = source.slice(start, headerEnd === -1 ? undefined : headerEnd)
  if (header.includes('{')) {
    const open = source.indexOf('{', start)
    return source.slice(open + 1, source.indexOf('}', open))
  }
  if (headerEnd === -1) return ''
  const indent = indentOf(source.slice(lineStart, start + 1))
  const body: string[] = []
  for (const line of source.slice(headerEnd + 1).split('\n')) {
    if (line.trim() !== '' && indentOf(line) <= indent) break
    body.push(line)
  }
  return body.join('\n')
}

const selfHostedFamily = (body: string) => {
  const family = FONT_FACE_FAMILY.exec(body)?.[2]?.trim()
  if (family === undefined || !URL_SOURCE.test(body)) return undefined
  return family
}

const fontFaceFamilies = (source: string) => [
  ...[...source.matchAll(FONT_FACE_INCLUDE)].map(([, , family = '']) => family),
  ...[...source.matchAll(FONT_FACE_RULE)].flatMap(({ index }) => {
    const family = selfHostedFamily(fontFaceBody(source, index))
    return family === undefined ? [] : [family]
  })
]

/**
 * The families a project self-hosts, read from its stylesheets: every
 * `fonts.font-face` include and every `@font-face` with a `url()` source. A
 * family named through a variable or `#{…}` is not read, nor a face fontaine
 * wrote itself (`<family> fallback`, which has a `local()` source).
 */
export const webFontFamilies = (sources: readonly string[]): string[] => [
  ...new Set(
    sources
      .map(withoutComments)
      .flatMap(fontFaceFamilies)
      .filter((family) => !INTERPOLATED.test(family))
  )
]

const unquoted = (family: string) =>
  family.trim().replace(/^(['"])(.*)\1$/, '$2')

const isFallbackName = (family: string) =>
  family.toLowerCase().endsWith(FALLBACK_SUFFIX)

const fallbackOf = (family: string) =>
  `${family}${FALLBACK_SUFFIX}`.toLowerCase()

/** The web fonts a stack names before any fallback face, each without its own right after it. */
const unfollowedWebFonts = (
  stack: readonly string[],
  webFonts: ReadonlySet<string>
) => {
  const firstFallback = stack.findIndex(isFallbackName)
  const beforeFallbacks =
    firstFallback === -1 ? stack : stack.slice(0, firstFallback)
  return beforeFallbacks.filter(
    (family, index) =>
      webFonts.has(family.toLowerCase()) &&
      stack[index + 1]?.toLowerCase() !== fallbackOf(family)
  )
}

/**
 * Lists every custom property whose font stack names a web font without
 * `'<family> fallback'` right after it (`missing-fallback`). fontaine adds
 * its fallback face after a family it reads in a `font-family` declaration,
 * never inside a custom property: `--font-display: 'Bricolage Grotesque',
 * sans-serif` paints in an unscaled `sans-serif` until the font arrives, and
 * for good under `font-display: optional` when it misses. Pass the families
 * `webFontFamilies` reads from every stylesheet, plus any loaded elsewhere.
 * A web font listed after a fallback face is a glyph backup the fallback
 * always shadows, and passes.
 */
export const findFallbackFailures = (
  stylesheet: string,
  webFonts: readonly string[]
): FallbackFailure[] => {
  const known = new Set(webFonts.map((family) => family.toLowerCase()))
  return readDeclarations(stylesheet).flatMap(
    ({ line, property, text, value }) =>
      CUSTOM_PROPERTY.test(property)
        ? unfollowedWebFonts(value.split(',').map(unquoted), known).map(
            (family) => ({
              declaration: text,
              family,
              kind: 'missing-fallback' as const,
              line
            })
          )
        : []
  )
}
