import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  findFallbackBandFailures,
  findFallbackFailures,
  findFontAttributeFailures,
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues,
  findUnreadFontFaces,
  SHARED_TOKEN_DEFAULTS,
  SHARED_TOKENS,
  webFontFamilies
} from './audit.ts'
import { withoutComments } from './source-comments.ts'

const kinds = (stylesheet: string) =>
  findUnitFailures(stylesheet).map(({ kind, line }) => ({ kind, line }))

describe('findUnitFailures', () => {
  it('[units] passes rem sizes, rem clamps and named tokens', () => {
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

  it('[units] flags a text size or a spacing in px, wherever it sits in the value', () => {
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

  it('[units] flags a text size the viewport drives with no rem part', () => {
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

  it('[units] flags a box size, an offset or a translation in px', () => {
    expect(
      kinds(`.badge
  width: 18px
  min-block-size: 40px
  inset-inline-start: -2px
  top: 1px
  translate: 0 1px`).map(({ line }) => line)
    ).toEqual([2, 3, 4, 5, 6])
  })

  it('[units] flags a px custom property outside the families drawn in pixels', () => {
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

  it('[units] flags a size or a custom property measured in the font’s zero', () => {
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

  it('[units] flags an outline width that is not a whole number of pixels', () => {
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

  it('[units] flags a px inside a transform translate function', () => {
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

  it('[units] passes a zero length in px, signed or not', () => {
    expect(
      kinds(`.flat
  margin: 0px
  inset: -0px 0.0px
  transform: translateY(0px)
  --safe-area-top: env(safe-area-inset-top, 0px)`)
    ).toEqual([])
  })

  it('[units] ignores a commented-out declaration', () => {
    expect(kinds('  // font-size: 12px')).toEqual([])
    expect(kinds('  /* margin: 4px */')).toEqual([])
  })

  it('[units] reads a grid track as a box size, in ch as in px', () => {
    expect(
      kinds(`.table
  grid-template-columns: minmax(20ch, 1fr) auto
  grid-template-columns: 22px minmax(0, 1fr)
  grid-auto-rows: minmax(2.5ch, auto)
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr))
  grid-template-columns: 2.4em minmax(0, 1fr)`)
    ).toEqual([
      { kind: 'ch', line: 2 },
      { kind: 'pixels', line: 3 },
      { kind: 'ch', line: 4 }
    ])
  })

  it('[units] passes pixels a custom property names as pixels, for a geometry a script reads', () => {
    expect(
      kinds(`.board
  --cell-px: 24px
  --cell: 24px
  inline-size: calc(var(--cell-px) * 8)`)
    ).toEqual([{ kind: 'pixels', line: 3 }])
  })

  it('[units] flags a border or a stroke token that is not a whole number of pixels', () => {
    expect(
      kinds(`:root
  --stroke-thin: 1.5px
  --stroke-chalk: 2.6px
.card
  border: 1.5px solid var(--rule)
  border-block-end-width: 0.5px
  border-radius: 0.5px
  border-inline-start: var(--stroke-bold) solid var(--rule)
  outline: var(--stroke-thin) dashed var(--edge)`)
    ).toEqual([
      { kind: 'fractional-stroke', line: 2 },
      { kind: 'fractional-stroke', line: 5 },
      { kind: 'fractional-stroke', line: 6 }
    ])
  })

  it('[units] passes every token tokens.defaults declares', () => {
    const tokens = readFileSync(
      new URL('_tokens.sass', import.meta.url),
      'utf8'
    )
    expect(findUnitFailures(tokens)).toEqual([])
    expect(findUnnamedValues(tokens)).toEqual([])
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

  it('[audit] keeps a // after an escaped quote, and in a template string over several lines', () => {
    const source = `content: "say \\" // still a string"
const html = \`<a>
// still a template\``
    expect(withoutComments(source)).toBe(source)
  })

  it('[audit] ends an unclosed string at its line, and an unclosed block comment at the end', () => {
    const stripped = withoutComments(`content: 'unclosed
a // gone
b /* gone
gone`)
    expect(stripped.split('\n').map((line) => line.trimEnd())).toEqual([
      "content: 'unclosed",
      'a',
      'b',
      ''
    ])
  })
})

describe('findTypeLiterals', () => {
  it('[voice] passes a voice that comes from tokens and mixins', () => {
    expect(
      findTypeLiterals(`.title
  @include typography.title
  font-weight: var(--weight-strong)
  line-height: inherit
  letter-spacing: var(--tracking-tight)`)
    ).toEqual([])
  })

  it('[voice] flags a weight, a leading or a tracking written as a literal', () => {
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

  it('[names] passes radii and durations taken from tokens', () => {
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

  it('[names] flags a radius, a duration or a delay written as a literal', () => {
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

  it('[names] flags a font size written as a literal length', () => {
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

  it('[names] passes a font size from a step, a fitted floor, a unit token, the parent or a keyword', () => {
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

  it('[names] flags a raw safe-area inset and a side pair written by hand', () => {
    expect(
      unnamed(`:root
  --gutter-left: max(var(--gutter), var(--safe-area-left))
  --safe-area-top: env(safe-area-inset-top, 0px)
  --page-inline: max(var(--space-l), var(--safe-area-left))
.page
  padding-inline: max(var(--space-l), var(--safe-area-left)) max(var(--space-l), var(--safe-area-right))
  padding-inline-start: var(--gutter-left)
  padding-block-end: max(var(--space-m), var(--safe-area-bottom))
  padding-top: env(safe-area-inset-top)
  inset-inline-end: max(var(--space-s), env(safe-area-inset-right, 0px))`)
    ).toEqual([
      { kind: 'gutter', line: 4 },
      { kind: 'gutter', line: 6 },
      { kind: 'safe-area', line: 9 },
      { kind: 'safe-area', line: 10 }
    ])
  })
})

describe('findTokenFailures', () => {
  it('[tokens] passes a name declared in a stylesheet, set from a script, registered or shared', () => {
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

  it('[tokens] flags a name read but declared nowhere, and a parallel to a shared family', () => {
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

  it('[tokens] passes a name a library provides at runtime', () => {
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

  it('[tokens] lists both failures of a name that is a parallel and an alias, the alias first', () => {
    expect(
      findTokenFailures([
        `:root
  --ring-thick: var(--outline-thick) solid var(--focus, currentColor)`
      ])
    ).toEqual([
      { kind: 'alias', name: '--ring-thick' },
      { kind: 'parallel', name: '--ring-thick' }
    ])
  })

  it('[tokens] does not read a name in a comment, in a stylesheet or a script', () => {
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

  it('[tokens] skips a name built by Sass or template interpolation', () => {
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

  it('[tokens] passes a family name that is derived or names something else', () => {
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

  it('[tokens] flags a family name with a size suffix, or holding a bare length', () => {
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

  it('[tokens] flags a second name for a distinctive default value', () => {
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

  it('[tokens] holds every name and value tokens.defaults declares', () => {
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
  it('[fonts] reads the families self-hosted by the mixin and by a face with a url source', () => {
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

  it('[fonts] reads a family held in a variable, drawn only by fallback faces, or passed to a face mixin', () => {
    expect(
      webFontFamilies([
        `
@use '@adrienlcp/styles/fonts'

$display: 'Bricolage Grotesque'

@include fonts.font-face($display, '/fonts/bricolage.woff2', fonts.$latin)
@include fonts.fallback-faces('Sofia Sans', $sofia-metrics, 0.964556, (300 449: 1.0091))

@mixin face($family, $file)
  @include fonts.font-face($family, '/fonts/#{$file}.woff2', fonts.$latin)
`,
        `
@use 'faces'

@include faces.face('Onest', 'onest')
@include faces.face($file: 'gochi', $family: 'Gochi Hand')
`,
        '@font-face{font-family:"Barlow fallback";font-style:normal;font-weight:400 649;src:local("Arial")}'
      ])
    ).toEqual([
      'Bricolage Grotesque',
      'Sofia Sans',
      'Barlow',
      'Onest',
      'Gochi Hand'
    ])
  })
})

describe('findUnreadFontFaces', () => {
  it('[fonts] lists a face whose family or bands it cannot read', () => {
    expect(
      findUnreadFontFaces(`@use '@adrienlcp/styles/fonts'

$faces: ('Barlow': (400, 600))
$display: 'Archivo'
$display: 'Onest'

@layer base
  @each $family, $weights in $faces
    @include fonts.font-face($family, '/fonts/#{$family}.woff2', fonts.$latin)
  @include fonts.font-face($display, '/fonts/display.woff2', fonts.$latin)
  @include fonts.fallback-faces('Barlow', $metrics, 0.9, fonts.$barlow-widths)
  @font-face
    font-family: '#{$display} fallback'
    src: local('Arial')`).map(({ kind, line }) => ({ kind, line }))
    ).toEqual([
      { kind: 'unread-family', line: 9 },
      { kind: 'unread-family', line: 10 },
      { kind: 'unread-weights', line: 11 },
      { kind: 'unread-family', line: 12 }
    ])
  })

  it('[fonts] passes literal families, a variable assigned once and the faces of a face mixin', () => {
    expect(
      findUnreadFontFaces(`@use '@adrienlcp/styles/fonts'

$display: 'Archivo'
$widths: (400 649: 1.02, 650 800: 1.04)

@mixin face($family, $file)
  @font-face
    font-family: $family
    src: url('/fonts/#{$file}.woff2')
  @include fonts.fallback-faces($family, $metrics, 0.9, (400: 1))

@include fonts.font-face($display, '/fonts/archivo.woff2', fonts.$latin)
@include fonts.fallback-faces($display, $metrics, 0.9, $widths)
@include face('Onest', 'onest')`)
    ).toEqual([])
  })
})

describe('findFallbackBandFailures', () => {
  const FONTS = `@use '@adrienlcp/styles/fonts'

@layer base
  @include fonts.font-face('Sofia Sans', '/fonts/sofia.woff2', fonts.$latin, $weight: 300 800)
  @include fonts.font-face('Sofia Sans', '/fonts/sofia-italic.woff2', fonts.$latin, $weight: 300 800, $style: italic)
  @include fonts.fallback-faces('Sofia Sans', $metrics, 0.96, (300 449: 1.01, 450 649: 1, 650 800: 1.05, 850 900: 1.1))
  @include fonts.font-face('Onest', '/fonts/onest.woff2', fonts.$latin)
  @font-face
    font-family: 'Geist'
    font-weight: 100 900
    src: url('/fonts/geist.woff2')`

  const TOKENS = `:root
  --font-prose: 'Sofia Sans', 'Sofia Sans fallback', sans-serif
  --weight-strong: 700`

  it('[fonts] lists a weight no band covers, a style no band draws and a band nothing sets', () => {
    expect(
      findFallbackBandFailures([
        FONTS,
        TOKENS,
        `@mixin body
  font-family: var(--font-prose)
  font-weight: 400

@mixin title
  font-family: var(--font-prose)
  font-weight: 820

@mixin strong
  font-weight: var(--weight-strong)

@mixin medium
  font-weight: 500

@mixin black
  font-weight: 950

@mixin code
  font-family: 'Onest'
  font-weight: 900`
      ])
    ).toEqual([
      { family: 'sofia sans', kind: 'uncovered-style', style: 'italic' },
      {
        declaration: 'font-weight: 820',
        family: 'sofia sans',
        kind: 'uncovered-weight',
        weight: 820
      },
      {
        declaration: 'font-weight: 950',
        family: 'sofia sans',
        kind: 'uncovered-weight',
        weight: 950
      },
      {
        family: 'sofia sans',
        kind: 'unused-band',
        style: 'normal',
        weights: '850 900'
      }
    ])
  })

  it('[fonts] passes bands that cover every weight set, the italic ones included', () => {
    expect(
      findFallbackBandFailures([
        `@use '@adrienlcp/styles/fonts'

@include fonts.font-face('Sofia Sans', '/fonts/sofia.woff2', fonts.$latin, $weight: 300 800)
@include fonts.font-face('Sofia Sans', '/fonts/sofia-italic.woff2', fonts.$latin, $weight: 300 800, $style: italic)
@include fonts.fallback-faces('Sofia Sans', $metrics, 0.96, (300 449: 1.01, 650 800: 1.05))
@include fonts.fallback-faces('Sofia Sans', $metrics, 0.96, (300 449: 1.01), $style: italic)`,
        TOKENS,
        `.title
  font-family: var(--font-prose)
  font-weight: bold
.lead
  font-style: italic
  font-weight: normal`
      ])
    ).toEqual([])
  })

  it('[fonts] reads widths passed by name after the default size-adjust, beside figures and a stretch', () => {
    expect(
      findFallbackBandFailures([
        `@use '@adrienlcp/styles/fonts'

@include fonts.font-face('Archivo', '/fonts/archivo.woff2', fonts.$latin, $weight: 400 900)
@include fonts.fallback-faces('Archivo', $metrics, $widths: (400 649: 1.2, 650 900: 1.33), $figures: 1.1, $figure-separators: true, $stretch: 62% 70%)`,
        TOKENS,
        `.title
  font-weight: 700
.lead
  font-weight: 300`
      ])
    ).toEqual([
      {
        declaration: 'font-weight: 300',
        family: 'archivo',
        kind: 'uncovered-weight',
        weight: 300
      }
    ])
  })

  it('[fonts] reads a token’s fallback weight, skips a weight it cannot read and names a one-weight band alone', () => {
    expect(
      findFallbackBandFailures([
        `@use '@adrienlcp/styles/fonts'

@include fonts.font-face('Onest', '/fonts/onest.woff2', fonts.$latin, $weight: 300 900)
@include fonts.fallback-faces('Onest', $metrics, 0.9, (300 649: 1, 650 800: 1.02, 900: 1.1))`,
        `font-weight: var(--weight-unset, 700)
.lead
  font-weight: var(--weight-unset)
  font-weight: inherit`
      ])
    ).toEqual([
      { family: 'onest', kind: 'unused-band', style: 'normal', weights: '900' }
    ])
  })
})

describe('findFontAttributeFailures', () => {
  it('[fonts] lists a family named in SVG or JSX instead of a font token', () => {
    expect(
      findFontAttributeFailures(`<svg xmlns="http://www.w3.org/2000/svg">
  <g fill="var(--ink)" font-family="var(--font-letter)">
    <text font-family="Sofia Sans Condensed" x="0">A</text>
    <text style="fill: red; font-family: Arial">B</text>
    <text font-family="inherit">C</text>
  </g>
</svg>`).map(({ line }) => line)
    ).toEqual([3, 4])
    expect(
      findFontAttributeFailures(`export const Drawing = () => (
  <g fontFamily='var(--font-prose)'>
    <text fontFamily="Georgia, serif">A</text>
    <text fontFamily={family}>B</text>
    <text fontFamily={'var(--font-letter, sans-serif)'}>C</text>
    <text style={{ fontFamily: 'Arial' }}>D</text>
  </g>
)`).map(({ line }) => line)
    ).toEqual([3, 6])
  })
})

describe('findFallbackFailures', () => {
  const WEB_FONTS = ['Bricolage Grotesque', 'Barlow', 'Barlow Condensed']

  it('[fonts] lists a font token naming a web font without its fallback face', () => {
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

  it('[fonts] passes a web font followed by its fallback, a glyph backup after a fallback, and system stacks', () => {
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
