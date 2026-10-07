import { describe, expect, it } from 'vitest'

import { findTypeLiterals, findUnitFailures } from './audit.ts'

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
  border-radius: 4px
  box-shadow: 0 1px 2px black
  min-block-size: var(--target)
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

  it('[audit] passes pixels handed to rem(), which converts them', () => {
    expect(
      kinds(`.chip
  padding: sizes.rem(3px) var(--space-s)
  --text-caption: #{sizes.rem(13px)}
  margin: rem(2px)`)
    ).toEqual([])
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
