import { describe, expect, it } from 'vitest'

import { findUnitFailures } from './units.ts'

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

  it('[units] ignores a commented-out declaration', () => {
    expect(kinds('  // font-size: 12px')).toEqual([])
  })
})
