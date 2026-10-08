import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues,
  SHARED_TOKENS
} from './audit.ts'

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

  it('[audit] ignores a commented-out declaration', () => {
    expect(kinds('  // font-size: 12px')).toEqual([])
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

  it('[audit] knows every name tokens.defaults declares', () => {
    const tokens = readFileSync(
      new URL('_tokens.sass', import.meta.url),
      'utf8'
    )
    const declared = [...tokens.matchAll(/^\s*(--[\w-]+):/gm)].map(
      ([, name]) => name
    )
    expect(SHARED_TOKENS).toEqual(expect.arrayContaining(declared))
  })
})
