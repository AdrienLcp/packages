import { describe, expect, it } from 'vitest'

import type { OverflowCandidate } from './measure-overflow.ts'
import { overflowVerdictOf } from './overflow-verdict.ts'

const VIEWPORT_WIDTH = 360

const candidate = (
  path: string,
  box: { left?: number; right: number }
): OverflowCandidate => ({
  label: path.split('>').at(-1) ?? path,
  left: box.left ?? 0,
  path,
  right: box.right
})

describe('overflowVerdictOf', () => {
  it('[overflow] lets a document exactly as wide as its viewport fit', () => {
    expect(
      overflowVerdictOf({
        candidates: [],
        documentWidth: VIEWPORT_WIDTH,
        viewportWidth: VIEWPORT_WIDTH
      })
    ).toEqual({ status: 'fits' })
  })

  it('[overflow] lets a page fit whose wide element something clips', () => {
    expect(
      overflowVerdictOf({
        candidates: [candidate('main>table', { right: 900 })],
        documentWidth: VIEWPORT_WIDTH,
        viewportWidth: VIEWPORT_WIDTH
      }),
      'the in-page measure already drops clipped elements; a fitting document is the verdict'
    ).toEqual({ status: 'fits' })
  })

  it('[overflow] flags a document wider than its viewport, by the rounded-up excess', () => {
    expect(
      overflowVerdictOf({
        candidates: [],
        documentWidth: 384.4,
        viewportWidth: VIEWPORT_WIDTH
      })
    ).toEqual({ culprits: [], excess: 25, status: 'overflows' })
  })

  it('[overflow] names the innermost element, not every wrapper around it', () => {
    const wrapper = candidate('main:nth-child(1)', { right: 400 })
    const card = candidate('main:nth-child(1)>div:nth-child(2)', { right: 400 })
    const table = candidate(
      'main:nth-child(1)>div:nth-child(2)>table:nth-child(1)',
      {
        right: 400
      }
    )

    expect(
      overflowVerdictOf({
        candidates: [wrapper, card, table],
        documentWidth: 400,
        viewportWidth: VIEWPORT_WIDTH
      })
    ).toEqual({
      culprits: [{ excess: 40, label: 'table:nth-child(1)' }],
      excess: 40,
      status: 'overflows'
    })
  })

  it('[overflow] does not take a sibling whose path starts alike for a descendant', () => {
    const first = candidate('div:nth-child(1)', { right: 380 })
    const eleventh = candidate('div:nth-child(11)', { right: 370 })

    expect(
      overflowVerdictOf({
        candidates: [first, eleventh],
        documentWidth: 380,
        viewportWidth: VIEWPORT_WIDTH
      })
    ).toMatchObject({
      culprits: [
        { excess: 20, label: 'div:nth-child(1)' },
        { excess: 10, label: 'div:nth-child(11)' }
      ]
    })
  })

  it('[overflow] measures an element past the left edge by how far it reaches', () => {
    expect(
      overflowVerdictOf({
        candidates: [candidate('aside', { left: -32, right: 200 })],
        documentWidth: 370,
        viewportWidth: VIEWPORT_WIDTH
      })
    ).toMatchObject({ culprits: [{ excess: 32, label: 'aside' }] })
  })

  it('[overflow] names at most three culprits, in document order', () => {
    const culprits = ['a', 'b', 'c', 'd'].map((path) =>
      candidate(path, { right: 380 })
    )

    const verdict = overflowVerdictOf({
      candidates: culprits,
      documentWidth: 380,
      viewportWidth: VIEWPORT_WIDTH
    })

    expect(
      verdict.status === 'overflows' &&
        verdict.culprits.map(({ label }) => label)
    ).toEqual(['a', 'b', 'c'])
  })
})
