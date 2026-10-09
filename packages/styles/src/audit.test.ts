import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  findFallbackFailures,
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues,
  SHARED_TOKEN_DEFAULTS,
  SHARED_TOKENS,
  webFontFamilies
} from './audit.ts'
import { withoutComments } from './source-comments.ts'

const kinds = (stylesheet: string) =>
  findUnitFailures(stylesheet).map(({ kind, line }) => ({ kind, line }))

describe('findUnitFailures', () => {
  it('[audit] passes rem sizes, rem clamps and named tokens', () => {
    expect(
      kinds(`
:root
  --text-m: 1rem
  --text-display: clamp(2rem, 1.5rem + 2.5vw, 3.5rem)
  --space-s: 0.5rem
  --stroke-hair: 1px
.title
  font-size: var(--text-display)
  padding: calc(var(--space-s) - var(--stroke-hair)) var(--space-m)
  border-radius: var(--radius-s)
  box-shadow: 0 1px 2px black
  min-block-size: var(--target)
  --radius-s: 4px
  --stroke-bold: 2px
  --shadow-raised: 0 1px 2px black
  --target: 44px
  width: 100%
  inset: 0
.cell
  font-size: max(var(--text-xs), 3cqi)
.score
  font-size: calc(var(--cu) * 4)
`)
    ).toEqual([])
  })

  it('[audit] flags a text size or a spacing in px, wherever it sits in the value', () => {
    expect(
      kinds(`.plate
  font-size: 9.4px
  --text-xs: 13px
  font-size: clamp(14px, 4cqi, 2rem)
  margin-inline: -1px
  gap: calc(var(--space-s) + 2px)
  --space-l: 24px;`)
    ).toEqual([
      { kind: 'pixels', line: 2 },
      { kind: 'pixels', line: 3 },
      { kind: 'pixels', line: 4 },
      { kind: 'pixels', line: 5 },
      { kind: 'pixels', line: 6 },
      { kind: 'pixels', line: 7 }
    ])
  })

  it('[audit] flags a text size the viewport drives with no rem part', () => {
    expect(
      kinds(`.hero
  font-size: 2.4vw
  --text-title: min(21vh, 42vw)
  padding: 4vmin`)
    ).toEqual([
      { kind: 'viewport-without-rem', line: 2 },
      { kind: 'viewport-without-rem', line: 3 }
    ])
  })

  it('[audit] flags a box size, an offset or a translation in px', () => {
    expect(
      kinds(`.badge
  width: 18px
  min-block-size: 40px
  inset-inline-start: -2px
  top: 1px
  translate: 0 1px`).map(({ line }) => line)
    ).toEqual([2, 3, 4, 5, 6])
  })

  it('[audit] flags a px custom property outside the families drawn in pixels', () => {
    expect(
      kinds(`:root
  --gap: 3px
  --control-m: 34px
  --stroke-hair: 1px`)
    ).toEqual([
      { kind: 'pixels', line: 2 },
      { kind: 'pixels', line: 3 }
    ])
  })

  it('[audit] flags a size or a custom property measured in the font’s zero', () => {
    expect(
      kinds(`:root
  --measure: 65ch
  --measure-title: 28ch
  --measure-lead: 34em
.digits
  inline-size: calc(4ch + var(--space-s))
  max-width: 0ch
  letter-spacing: 0.1ch`)
    ).toEqual([
      { kind: 'ch', line: 2 },
      { kind: 'ch', line: 3 },
      { kind: 'ch', line: 6 }
    ])
  })

  it('[audit] flags an outline width that is not a whole number of pixels', () => {
    expect(
      kinds(`:root
  --outline-thick: 2.5px
  --outline-offset: 2.5px
  --outline-thin: 1px
.card
  outline: 1.5px solid var(--focus)
  outline-width: 2.0px
  outline-offset: 0.5px`)
    ).toEqual([
      { kind: 'fractional-outline', line: 2 },
      { kind: 'fractional-outline', line: 6 }
    ])
  })

  it('[audit] flags a px inside a transform translate function', () => {
    expect(
      kinds(`.knob
  transform: translateX(2px)
  transform: rotate(45deg) translate(0, -1px)
  transform: translateY(calc(var(--space-s) + 3px))
  transform: translate3d(0, 0, 1px)
  transform: translateZ(4px) scale(1.1)
  transform: translateX(var(--space-s)) rotate(2deg)
  transform: scale(1.02)`)
    ).toEqual([
      { kind: 'pixels', line: 2 },
      { kind: 'pixels', line: 3 },
      { kind: 'pixels', line: 4 },
      { kind: 'pixels', line: 5 },
      { kind: 'pixels', line: 6 }
    ])
  })

  it('[audit] passes a zero length in px, signed or not', () => {
    expect(
      kinds(`.flat
  margin: 0px
  inset: -0px 0.0px
  transform: translateY(0px)
  --safe-area-top: env(safe-area-inset-top, 0px)`)
    ).toEqual([])
  })

  it('[audit] ignores a commented-out declaration', () => {
    expect(kinds('  // font-size: 12px')).toEqual([])
    expect(kinds('  /* margin: 4px */')).toEqual([])
  })
})

describe('withoutComments', () => {
  it('[audit] blanks line and block comments, keeping the line count', () => {
    const source = `a // var(--gone)
b /* var(--gone)
 */ c`
    const stripped = withoutComments(source)
    expect(stripped).not.toContain('--gone')
    expect(stripped.split('\n')).toHaveLength(3)
  })

  it('[audit] keeps a // inside a url() or a string', () => {
    const source = `background: url(https://example.com/a.png)
const link = 'https://example.com'`
    expect(withoutComments(source)).toBe(source)
  })
})

describe('findTypeLiterals', () => {
  it('[audit] passes a voice that comes from tokens and mixins', () => {
    expect(
      findTypeLiterals(`.title
  @include typography.title
  font-weight: var(--weight-strong)
  line-height: inherit
  letter-spacing: var(--tracking-tight)`)
    ).toEqual([])
  })

  it('[audit] flags a weight, a leading or a tracking written as a literal', () => {
    expect(
      findTypeLiterals(`.score
  font-weight: 650
  line-height: 1.05
  letter-spacing: 0.06em
  font-weight: bold`).map(({ line }) => line)
    ).toEqual([2, 3, 4, 5])
  })
})

describe('findUnnamedValues', () => {
  const unnamed = (stylesheet: string) =>
    findUnnamedValues(stylesheet).map(({ kind, line }) => ({ kind, line }))

  it('[audit] passes radii and durations taken from tokens', () => {
    expect(
      unnamed(`.card
  border-radius: var(--radius-surface)
  border-start-start-radius: 0
  border-radius: 50%
  transition: opacity var(--transition-base, 0s), translate var(--transition-fast, 0s)
  transition-delay: calc(var(--stagger-index) * var(--transition-fast))
  animation: spin calc(var(--transition-slow) * 3) linear infinite
  --radius-surface: 12px
  --transition-flow: 640ms`)
    ).toEqual([])
  })

  it('[audit] flags a radius, a duration or a delay written as a literal', () => {
    expect(
      unnamed(`.toast
  border-radius: 6px
  border-top-left-radius: 0.5rem
  transition: opacity 200ms ease
  animation: pulse 1.2s infinite
  transition-delay: 90ms
  animation-duration: var(--t, 300ms)`)
    ).toEqual([
      { kind: 'radius', line: 2 },
      { kind: 'radius', line: 3 },
      { kind: 'duration', line: 4 },
      { kind: 'duration', line: 5 },
      { kind: 'duration', line: 6 },
      { kind: 'duration', line: 7 }
    ])
  })

  it('[audit] flags a font size written as a literal length', () => {
    expect(
      unnamed(`.leaf
  font-size: 1.25rem
  font-size: 20px
  font-size: 1.1em
  font-size: clamp(1rem, 2vw, 2rem)`)
    ).toEqual([
      { kind: 'text-size', line: 2 },
      { kind: 'text-size', line: 3 },
      { kind: 'text-size', line: 4 },
      { kind: 'text-size', line: 5 }
    ])
  })

  it('[audit] passes a font size from a step, a fitted floor, a unit token, the parent or a keyword', () => {
    expect(
      unnamed(`.leaf
  font-size: var(--text-m)
  font-size: max(var(--text-s), 7cqi)
  font-size: calc(var(--cu) * 4)
  font-size: 1em
  font-size: 100%
  font-size: inherit
  font-size: smaller
  --text-title: 2.75rem`)
    ).toEqual([])
  })
})

describe('findTokenFailures', () => {
  it('[audit] passes a name declared in a stylesheet, set from a script, registered or shared', () => {
    expect(
      findTokenFailures([
        `:root
  --ink: oklch(20% 0 0)
@property --angle
  syntax: '<angle>'
.a
  color: var(--ink)
  rotate: var(--angle)
  translate: 0 calc(var(--stagger-index) * var(--space-s))
  outline: var(--ring)
  min-block-size: var(--control-height)
  --space-s: 0.5rem`,
        `<li style={{ '--stagger-index': index }} />`
      ])
    ).toEqual([])
  })

  it('[audit] flags a name read but declared nowhere, and a parallel to a shared family', () => {
    expect(
      findTokenFailures([
        `:root
  --control-m: 2.25rem
  --outline-thin: 1px
  --measure-prose: 62ch
.a
  min-block-size: var(--control-touch)
  max-inline-size: var(--measure-prose)`
      ])
    ).toEqual([
      { kind: 'parallel', name: '--control-m' },
      { kind: 'undeclared', name: '--control-touch' },
      { kind: 'parallel', name: '--outline-thin' }
    ])
  })

  it('[audit] passes a name a library provides at runtime', () => {
    const sources = [
      `.list
  max-block-size: var(--visual-viewport-height)`
    ]
    expect(findTokenFailures(sources)).toEqual([
      { kind: 'undeclared', name: '--visual-viewport-height' }
    ])
    expect(
      findTokenFailures(sources, { provided: ['--visual-viewport-height'] })
    ).toEqual([])
  })

  it('[audit] does not read a name in a comment, in a stylesheet or a script', () => {
    expect(
      findTokenFailures([
        `.a
  // the night book lifts var(--tint-n)
  /* var(--old-name) */
  background: url(https://example.com/a.png)`,
        `// reads var(--from-a-comment)
/** var(--from-a-doc-block) */
const href = 'https://example.com'`
      ])
    ).toEqual([])
  })

  it('[audit] skips a name built by Sass or template interpolation', () => {
    const placeholder = ['$', '{index}'].join('')
    expect(
      findTokenFailures([
        `.leaf
  color: var(--g#{$generation})
  background: var(--on-g#{$generation})`,
        `const fill = \`var(--pawn-${placeholder})\``,
        'const edge = `var(--pawn-` + side + `)`'
      ])
    ).toEqual([])
  })

  it('[audit] passes a family name that is derived or names something else', () => {
    expect(
      findTokenFailures([
        `:root
  --target-reach: calc((var(--target) - var(--icon-m)) / -2)
  --control-ink: oklch(20% 0 0)
  --ring-color-muted: var(--rule)
.a
  margin: var(--target-reach)
  color: var(--control-ink)
  outline-color: var(--ring-color-muted)`
      ])
    ).toEqual([])
  })

  it('[audit] flags a family name with a size suffix, or holding a bare length', () => {
    expect(
      findTokenFailures([
        `:root
  --control-touch: max(var(--target), 3rem)
  --control-lg: calc(var(--target) * 1.25)
  --control-2xs: 1.5rem
  --outline-thin: 1px
  --control-row: 2.5rem`
      ]).map(({ name }) => name)
    ).toEqual([
      '--control-2xs',
      '--control-lg',
      '--control-row',
      '--control-touch',
      '--outline-thin'
    ])
  })

  it('[audit] flags a second name for a distinctive default value', () => {
    expect(
      findTokenFailures([
        `:root
  --timing: cubic-bezier(0.16, 1, 0.3, 1)
  --edge: inset 0 0 0 var(--stroke-hair) var(--rule, color-mix(in oklab, currentColor 25%, transparent))
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1)
  --gap-hair: 1px
  --wait: 150ms`
      ])
    ).toEqual([
      { kind: 'alias', name: '--edge' },
      { kind: 'alias', name: '--timing' }
    ])
  })

  it('[audit] holds every name and value tokens.defaults declares', () => {
    const tokens = readFileSync(
      new URL('_tokens.sass', import.meta.url),
      'utf8'
    )
    const declared = Object.fromEntries(
      [...tokens.matchAll(/^\s*(--[\w-]+):\s*(.+?)\s*$/gm)].map(
        ([, name, value]) => [name, value]
      )
    )
    expect(SHARED_TOKEN_DEFAULTS).toEqual(declared)
    expect(SHARED_TOKENS).toEqual(expect.arrayContaining(Object.keys(declared)))
  })
})

describe('webFontFamilies', () => {
  it('[audit] reads the families self-hosted by the mixin and by a face with a url source', () => {
    expect(
      webFontFamilies([
        `
@use '@adrienlcp/styles/fonts'

@layer base
  @include fonts.font-face('Atkinson Hyperlegible', '/fonts/atkinson-latin.woff2', fonts.$latin)
  @font-face
    font-display: swap
    font-family: 'Shrikhand'
    src: url('/fonts/shrikhand-latin.woff2') format('woff2')
  @font-face
    font-family: 'Shrikhand fallback'
    src: local('Arial')
`,
        '@font-face { font-family: "Gochi Hand"; src: url(/fonts/gochi.woff2) format("woff2") }',
        `
// @include fonts.font-face('Commented Out', '/fonts/no.woff2', fonts.$latin)
@mixin face($family)
  @font-face
    font-family: $family
    src: url('/fonts/#{$family}.woff2')
`
      ])
    ).toEqual(['Atkinson Hyperlegible', 'Shrikhand', 'Gochi Hand'])
  })
})

describe('findFallbackFailures', () => {
  const WEB_FONTS = ['Bricolage Grotesque', 'Barlow', 'Barlow Condensed']

  it('[audit] lists a font token naming a web font without its fallback face', () => {
    expect(
      findFallbackFailures(
        `
:root
  --font-display: 'Bricolage Grotesque', sans-serif
  --font-text: "Barlow", system-ui, 'Barlow fallback', sans-serif
`,
        WEB_FONTS
      )
    ).toEqual([
      {
        declaration: "--font-display: 'Bricolage Grotesque', sans-serif",
        family: 'Bricolage Grotesque',
        kind: 'missing-fallback',
        line: 3
      },
      {
        declaration: `--font-text: "Barlow", system-ui, 'Barlow fallback', sans-serif`,
        family: 'Barlow',
        kind: 'missing-fallback',
        line: 4
      }
    ])
  })

  it('[audit] passes a web font followed by its fallback, a glyph backup after a fallback, and system stacks', () => {
    expect(
      findFallbackFailures(
        `
:root
  --font-display: 'Bricolage Grotesque', 'bricolage grotesque Fallback', sans-serif
  --font-figure: 'Barlow Condensed', 'Barlow Condensed fallback', 'Barlow', 'Arial Narrow', sans-serif
  --font-code: ui-monospace, 'Cascadia Code', Consolas, monospace
  // --font-old: 'Barlow', sans-serif
.title
  font-family: 'Barlow', sans-serif
`,
        WEB_FONTS
      )
    ).toEqual([])
  })
})
