import {
  type FallbackBand,
  familiesThroughMixins,
  readFontFaces,
  type UnreadFace,
  type WebFace
} from './font-faces.ts'
import { withoutComments } from './source-comments.ts'
import { readDeclarations } from './stylesheet-declarations.ts'

/** A declaration that breaks a stylesheet rule, with the line it sits on (1-based). */
export type StyleFailure<Kind extends string> = {
  declaration: string
  kind: Kind
  line: number
}

export type UnitFailure = StyleFailure<
  | 'pixels'
  | 'viewport-without-rem'
  | 'ch'
  | 'fractional-outline'
  | 'fractional-stroke'
>
export type TypeLiteral = StyleFailure<'type-literal'>
export type UnnamedValue = StyleFailure<
  'radius' | 'duration' | 'text-size' | 'gutter' | 'safe-area'
>
/** A font token naming a web font that fontaine's fallback face never follows. */
export type FallbackFailure = StyleFailure<'missing-fallback'> & {
  family: string
}
/** A face whose family or weight bands the audit cannot read, so no check reaches it. */
export type UnreadFontFace = UnreadFace
/** A `font-family` attribute or style key in markup that names no font token. */
export type FontAttributeFailure = StyleFailure<'font-attribute'>

/** A weight or a style the fallback faces drawn per band miss, or a band nothing sets. */
export type FallbackBandFailure =
  | {
      declaration: string
      family: string
      kind: 'uncovered-weight'
      weight: number
    }
  | { family: string; kind: 'uncovered-style'; style: string }
  | { family: string; kind: 'unused-band'; style: string; weights: string }

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
  '--stroke-bold': '3px',
  '--stroke-hair': '1px',
  '--stroke-thin': '2px',
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
  /^(font-size|font|margin(-[\w-]+)?|padding(-[\w-]+)?|gap|row-gap|column-gap|text-indent|((min|max)-)?(width|height|inline-size|block-size)|inset(-[\w-]+)?|top|right|bottom|left|translate|flex-basis|grid|grid-template(-columns|-rows)?|grid-auto-(columns|rows))$/
const CUSTOM_PROPERTY = /^--[\w-]+$/
const PIXEL_TOKEN =
  /^--((stroke|outline|radius|shadow|target)(-[\w-]+)?|[\w-]+-px)$/
const TYPE_PROPERTY = /^(font-weight|line-height|letter-spacing)$/
const RADIUS_PROPERTY = /^border(-[\w-]+)?-radius$/
const MOTION_PROPERTY = /^(transition|animation)(-duration|-delay)?$/
const PIXELS = /(^|[^\w.])-?(\d*\.?\d+)px\b/g
const CH = /(^|[^\w.-])(\d*\.?\d+)ch\b/g
const FRACTIONAL_PIXELS = /(^|[^\w.])\d*\.\d*[1-9]\d*px\b/
const OUTLINE_WIDTH = /^(outline|outline-width|--outline-(?!offset\b)[\w-]+)$/
const STROKE_WIDTH =
  /^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|--stroke-(hair|thin|bold))$/
const SIDE_SAFE_AREA = /--safe-area-(left|right)\b/
const RAW_SAFE_AREA = /\benv\(\s*safe-area-(max-)?inset-/
const SAFE_AREA_TOKEN = /^--safe-area-[\w-]+$/
const GUTTER_TOKEN = /^--gutter-(left|right)$/
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
const INTERPOLATED = /[#$]\{|^\$/
const FALLBACK_SUFFIX = ' fallback'

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
  if (STROKE_WIDTH.test(property) && FRACTIONAL_PIXELS.test(value))
    return 'fractional-stroke'
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
  if (RAW_SAFE_AREA.test(value) && !SAFE_AREA_TOKEN.test(property))
    return 'safe-area'
  if (
    value.includes('max(') &&
    SIDE_SAFE_AREA.test(value) &&
    !GUTTER_TOKEN.test(property)
  )
    return 'gutter'
  return undefined
}

/**
 * Lists every size in a stylesheet that the user's font size cannot reach: a
 * `px` text size, spacing, box size, offset or translation — a `transform`'s
 * `translate*()` included —, a `px` custom property outside the families
 * drawn in pixels (`--stroke-*`, `--outline-*`, `--radius-*`, `--shadow-*`,
 * `--target`), a text size driven by the viewport with no rem part (each
 * `pixels` or `viewport-without-rem`), a size, a grid track or a custom
 * property in `ch` (`ch`) — the width of the font's zero, which the fallback
 * face and the web font draw differently, so the box changes when one
 * replaces the other —, an outline width that is not a whole number of
 * pixels (`fractional-outline`) — Chromium draws an outline in whole device
 * pixels, so a `2.5px` ring is `2px` on a 1x screen —, or a border width or a
 * `--stroke-hair`, `--stroke-thin` or `--stroke-bold` that is not one either
 * (`fractional-stroke`): a border is floored to whole device pixels too, so a
 * `1.5px` stroke is the hairline on a 1x screen, and an inset shadow at that
 * width smears across two. An outline drawn with one of them passes: the
 * token's own declaration is the one checked. A stroke token of the app's own
 * for an SVG curve — `--stroke-chalk: 2.6px` — may be fractional: a curve is
 * antialiased whatever its width. A grid track in `px` is a box size like any
 * other. A custom property named `--*-px` holds pixels on purpose — a length
 * that must match a geometry a script computes in pixels, read back through
 * `getComputedStyle` — and passes. Reads one declaration per line, as Sass and
 * plain CSS are written; comments are not read. A zero passes in any unit,
 * and so does a size derived from a named unit token (`calc(var(--cu) * 4)`):
 * that is how a viewport-sized surface opts out.
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
 * `100%`). It also lists a raw `env(safe-area-inset-*)` outside the
 * `--safe-area-*` tokens, which carry its `0px` fallback (`safe-area`), and a
 * hand-written `max()` over `--safe-area-left` or `--safe-area-right`
 * (`gutter`): a page's sides pad by `--gutter-left` and `--gutter-right`.
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

/**
 * The families a project self-hosts, read from its stylesheets: every
 * `fonts.font-face` include, every `fonts.fallback-faces` include, every
 * `@font-face` with a `url()` source, and the family of every hand-written
 * `<family> fallback` face. A family held in a variable the same file assigns
 * once is read, and so is one passed to a face mixin of the app's own. One
 * built otherwise — in an `@each` loop, through `#{…}` — is not:
 * `findUnreadFontFaces` lists it.
 */
export const webFontFamilies = (sources: readonly string[]): string[] => {
  const readings = sources.map(readFontFaces)
  const mixins = readings.flatMap(({ mixins }) => mixins)
  return [
    ...new Set([
      ...readings.flatMap(({ bands, faces }) => [
        ...faces.map(({ family }) => family),
        ...bands.map(({ family }) => family)
      ]),
      ...sources.flatMap((source) => familiesThroughMixins(source, mixins))
    ])
  ].filter((family) => !INTERPOLATED.test(family))
}

/**
 * Lists every face in a stylesheet whose family (`unread-family`) or
 * `$widths` bands (`unread-weights`) the audit cannot read — a family built in
 * an `@each` loop, a `$widths` map from another module —: no fallback check
 * reaches it, and a font token that skips its fallback face passes unseen.
 * Write the family out, or assign it once to a variable in the same file. A
 * face inside a mixin that takes its family as a parameter passes: its
 * includes are read instead.
 */
export const findUnreadFontFaces = (stylesheet: string): UnreadFontFace[] =>
  readFontFaces(stylesheet).unread

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

const FONT_FACE_HEADER = /^\s*@font-face\b/
const WEIGHT_KEYWORDS: Readonly<Record<string, number>> = {
  bold: 700,
  normal: 400
}
const VAR_READ = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/
const INITIAL_WEIGHT = 400
const MAX_TOKEN_DEPTH = 4

type TokenValues = ReadonlyMap<string, readonly string[]>

const tokenValues = (sources: readonly string[]): TokenValues => {
  const values = new Map<string, string[]>()
  for (const { name, value } of declaredValues(sources.map(withoutComments)))
    values.set(name, [...(values.get(name) ?? []), value])
  return values
}

/** Every value an expression may hold: itself, or each value of the token it reads. */
const expand = (
  expression: string,
  tokens: TokenValues,
  depth = 0
): string[] => {
  const read = VAR_READ.exec(expression.trim())
  if (read === null || depth > MAX_TOKEN_DEPTH) return [expression.trim()]
  const values = tokens.get(read[1] ?? '') ?? (read[2] ? [read[2]] : [])
  return values.flatMap((value) => expand(value, tokens, depth + 1))
}

const weightsOf = (value: string, tokens: TokenValues) =>
  expand(value, tokens).flatMap((weight) => {
    const number = WEIGHT_KEYWORDS[weight] ?? Number(weight)
    return Number.isInteger(number) && number > 0 ? [number] : []
  })

const bandedFamilyOf = (
  value: string,
  tokens: TokenValues,
  banded: ReadonlySet<string>
) =>
  expand(value, tokens).flatMap((stack) => {
    const family = stack
      .split(',')
      .map(unquoted)
      .find((name) => !isFallbackName(name))
    return family !== undefined && banded.has(family.toLowerCase())
      ? [family.toLowerCase()]
      : []
  })

type WeightUse = {
  declaration: string
  families: readonly string[]
  style: string
  weight: number
}

/** Every weight a stylesheet sets, with the banded families and the style set in the same block. */
const weightUses = (
  stylesheet: string,
  tokens: TokenValues,
  banded: ReadonlySet<string>
): WeightUse[] => {
  const lines = stylesheet.split('\n')
  const declarations = readDeclarations(stylesheet).filter(
    ({ block }) => !FONT_FACE_HEADER.test(lines[block] ?? '')
  )
  const inBlock = (block: number, property: string) =>
    declarations.filter(
      (declaration) =>
        declaration.block === block && declaration.property === property
    )
  return declarations
    .filter(({ property }) => property === 'font-weight')
    .flatMap(({ block, text, value }) => {
      const stacks = inBlock(block, 'font-family')
      const families = stacks.flatMap((family) =>
        bandedFamilyOf(family.value, tokens, banded)
      )
      if (stacks.length > 0 && families.length === 0) return []
      const style = inBlock(block, 'font-style').at(-1)?.value ?? 'normal'
      return weightsOf(value, tokens).map((weight) => ({
        declaration: text,
        families,
        style,
        weight
      }))
    })
}

const inBand = (weight: number, { weights: [from, to] }: FallbackBand) =>
  weight >= from && weight <= to

const uncoveredStyles = (
  bands: readonly FallbackBand[],
  faces: readonly WebFace[]
): FallbackBandFailure[] => {
  const keys = new Set(
    faces.map(({ family, style }) => `${family.toLowerCase()}|${style}`)
  )
  const families = new Set(bands.map(({ family }) => family.toLowerCase()))
  return [...keys].flatMap((key) => {
    const [family = '', style = ''] = key.split('|')
    const covered = bands.some(
      (band) => band.family.toLowerCase() === family && band.style === style
    )
    return families.has(family) && !covered
      ? [{ family, kind: 'uncovered-style' as const, style }]
      : []
  })
}

const uncoveredWeights = (
  bands: readonly FallbackBand[],
  uses: readonly WeightUse[]
): FallbackBandFailure[] => {
  const familiesOf = (style: string) => [
    ...new Set(
      bands
        .filter((band) => band.style === style)
        .map(({ family }) => family.toLowerCase())
    )
  ]
  const covers = (family: string, style: string, weight: number) =>
    bands.some(
      (band) =>
        band.family.toLowerCase() === family &&
        band.style === style &&
        inBand(weight, band)
    )
  return uses.flatMap(({ declaration, families, style, weight }) => {
    const drawn = familiesOf(style)
    const checked = families.filter((family) => drawn.includes(family))
    const coveredSomewhere = drawn.some((family) =>
      covers(family, style, weight)
    )
    const missing =
      families.length > 0
        ? checked.filter((family) => !covers(family, style, weight))
        : coveredSomewhere
          ? []
          : drawn
    return missing.map((family) => ({
      declaration,
      family,
      kind: 'uncovered-weight' as const,
      weight
    }))
  })
}

const unusedBands = (
  bands: readonly FallbackBand[],
  uses: readonly WeightUse[]
): FallbackBandFailure[] => {
  const used = (family: string) => [
    INITIAL_WEIGHT,
    ...uses
      .filter(
        ({ families }) => families.length === 0 || families.includes(family)
      )
      .map(({ weight }) => weight)
  ]
  return bands
    .filter(
      (band) =>
        !used(band.family.toLowerCase()).some((weight) => inBand(weight, band))
    )
    .map(({ family, style, weights: [from, to] }) => ({
      family: family.toLowerCase(),
      kind: 'unused-band' as const,
      style,
      weights: from === to ? `${from}` : `${from} ${to}`
    }))
}

/**
 * Checks the fallback faces `fonts.fallback-faces` draws per weight band
 * against what the stylesheets set — fontaine's own faces copy every
 * `@font-face`, and are not read. Takes every stylesheet, as
 * `findTokenFailures` does; a family is reported in lower case:
 * - `uncovered-weight`: a `font-weight` — a literal, a keyword or a token —
 *   that no band of the family set in the same block covers, or, with no
 *   family there, no band of any family: that text paints in the closest
 *   band's face, scaled for another weight;
 * - `uncovered-style`: a family that serves files in a style — `italic` —
 *   its bands never draw: italic text in the fallback takes the upright face.
 *   It holds whether or not a stylesheet sets italic: `em` and `i` do;
 * - `unused-band`: a band no weight falls in — a weight set in a block with
 *   another family aside, and `400`, the weight text starts at, always in.
 */
export const findFallbackBandFailures = (
  sources: readonly string[]
): FallbackBandFailure[] => {
  const readings = sources.map(readFontFaces)
  const bands = readings.flatMap((reading) => reading.bands)
  const faces = readings.flatMap((reading) => reading.faces)
  const banded = new Set(bands.map(({ family }) => family.toLowerCase()))
  const tokens = tokenValues(sources)
  const uses = sources.flatMap((source) => weightUses(source, tokens, banded))
  return [
    ...uncoveredStyles(bands, faces),
    ...uncoveredWeights(bands, uses),
    ...unusedBands(bands, uses)
  ]
}

const FONT_ATTRIBUTE =
  /\b(font-family|fontFamily)\s*(=\s*\{?\s*|:\s*)(?:(["'`])(.*?)\3|([^\s;"'`}<>][^;"'`}<>\n]*))/g
const FONT_TOKEN = /^(var\(\s*--font-[\w-]+\s*(,[^)]*)?\)|inherit)$/

const lineOf = (source: string, index: number) =>
  source.slice(0, index).split('\n').length

/**
 * Lists every `font-family` attribute (`.svg`), `fontFamily` prop or style key
 * (`.tsx`) and inline `font-family:` that names a family instead of a font
 * token (`font-attribute`). A family named there gets no fallback face, and
 * SVG text whose family the page does not serve falls back to serif: SVG text
 * reads `var(--font-…)`, which carries the fallback face. An expression —
 * `fontFamily={family}` — is not read.
 */
export const findFontAttributeFailures = (
  source: string
): FontAttributeFailure[] => {
  const code = withoutComments(source)
  const lines = source.split('\n')
  return [...code.matchAll(FONT_ATTRIBUTE)].flatMap(
    ({ 1: name = '', 2: separator = '', 4: quoted, 5: bare, index }) => {
      const isCss = name === 'font-family' && separator.trim() === ':'
      if (quoted === undefined && !isCss) return []
      const value = (quoted ?? bare ?? '').trim()
      if (FONT_TOKEN.test(value)) return []
      const line = lineOf(code, index)
      return [
        {
          declaration: (lines[line - 1] ?? '').trim(),
          kind: 'font-attribute' as const,
          line
        }
      ]
    }
  )
}
