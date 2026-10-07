import { composite, contrastRatio, isTranslucent } from './color.ts'
import {
  type ColorScheme,
  readTokenDeclarations,
  resolveToken,
  type TokenError
} from './color-tokens.ts'

export type { ColorScheme, TokenError }

/** WCAG 2.2 level AA minimum contrast ratios. */
export const WCAG_AA = {
  /** Text at 24px, or 18.66px bold, and larger. */
  largeText: 3,
  /** Controls, icons, focus rings, the boundary of an input. */
  nonText: 3,
  /** Body text, labels, placeholders. */
  text: 4.5
} as const

/** Two tokens that meet on screen, named as declared: `{ foreground: '--ink', background: '--ground', minimum: WCAG_AA.text }`. */
export type ContrastPair = {
  background: string
  foreground: string
  minimum: number
}

export type ContrastFailure =
  | {
      kind: 'too-low'
      pair: ContrastPair
      ratio: number
      schemes: ColorScheme[]
    }
  | {
      error: TokenError | 'translucent-background'
      kind: 'unreadable'
      pair: ContrastPair
      token: string
    }

const SCHEMES: ColorScheme[] = ['light', 'dark']

const roundRatio = (ratio: number) => Math.floor(ratio * 100) / 100

const sameFailure = (
  failure: ContrastFailure,
  other: ContrastFailure | undefined
) =>
  JSON.stringify({ ...failure, schemes: [] }) ===
  JSON.stringify({ ...other, schemes: [] })

const checkPair = (
  declarations: ReturnType<typeof readTokenDeclarations>,
  pair: ContrastPair,
  scheme: ColorScheme
): ContrastFailure | undefined => {
  const background = resolveToken(declarations, pair.background, scheme)
  if (background.status === 'failure')
    return { kind: 'unreadable', pair, ...background.error }
  if (isTranslucent(background.data))
    return {
      error: 'translucent-background',
      kind: 'unreadable',
      pair,
      token: pair.background
    }

  const foreground = resolveToken(declarations, pair.foreground, scheme)
  if (foreground.status === 'failure')
    return { kind: 'unreadable', pair, ...foreground.error }

  const ratio = roundRatio(
    contrastRatio(composite(foreground.data, background.data), background.data)
  )
  if (ratio >= pair.minimum) return undefined
  return { kind: 'too-low', pair, ratio, schemes: [scheme] }
}

/**
 * Every pair below its minimum, in either scheme, read straight from the
 * stylesheet that declares the tokens. A translucent foreground is measured
 * over its background; a translucent background cannot be measured, since
 * what shows through decides it.
 *
 * @example
 * expect(findContrastFailures(tokens, [
 *   { foreground: '--ink-soft', background: '--ground', minimum: WCAG_AA.text }
 * ])).toEqual([])
 */
export const findContrastFailures = (
  stylesheet: string,
  pairs: readonly ContrastPair[]
): ContrastFailure[] => {
  const declarations = readTokenDeclarations(stylesheet)

  return pairs.flatMap((pair) => {
    const [light, dark] = SCHEMES.map((scheme) =>
      checkPair(declarations, pair, scheme)
    )
    if (light && sameFailure(light, dark)) {
      if (light.kind === 'unreadable') return [light]
      return [{ ...light, schemes: [...SCHEMES] }]
    }
    return [light, dark].filter((failure) => failure !== undefined)
  })
}
