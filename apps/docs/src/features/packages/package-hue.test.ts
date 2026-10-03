import { describe, expect, it } from 'vitest'

import { hueAmong } from './package-hue.ts'

describe('hueAmong', () => {
  it('[package-hue] gives the only package the first hue', () => {
    expect(hueAmong({ name: 'result', names: ['result'] })).toBe(28)
  })

  it('[package-hue] spreads the packages evenly round the wheel in alphabetical order', () => {
    const names = ['styles', 'browser', 'result']

    expect(names.map((name) => hueAmong({ name, names }))).toEqual([
      268, 28, 148
    ])
  })

  it('[package-hue] wraps past a full turn', () => {
    const names = ['a', 'b', 'c', 'd']

    expect(names.map((name) => hueAmong({ name, names }))).toEqual([
      28, 118, 208, 298
    ])
  })

  it('[package-hue] rounds to a whole degree', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

    expect(hueAmong({ name: 'g', names })).toBe(337)
  })

  it('[package-hue] keeps a package its hue whatever order the names come in', () => {
    expect(hueAmong({ name: 'b', names: ['c', 'a', 'b'] })).toBe(
      hueAmong({ name: 'b', names: ['a', 'b', 'c'] })
    )
  })
})
