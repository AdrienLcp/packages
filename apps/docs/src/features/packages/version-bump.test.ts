import { describe, expect, it } from 'vitest'

import {
  isVersionBump,
  largestBumpOf,
  type VersionBump
} from './version-bump.ts'

const largestCases: [readonly VersionBump[], VersionBump][] = [
  [['patch', 'minor', 'patch'], 'minor'],
  [['patch', 'major', 'minor'], 'major'],
  [['minor'], 'minor'],
  [['patch', 'patch'], 'patch']
]

describe('largestBumpOf', () => {
  it.each(largestCases)(
    '[version-bump] takes the largest of %j: %s',
    (bumps, largest) => {
      expect(largestBumpOf(bumps)).toBe(largest)
    }
  )

  it('[version-bump] reads no note as a patch', () => {
    expect(largestBumpOf([])).toBe('patch')
  })
})

describe('isVersionBump', () => {
  it.each([['major'], ['minor'], ['patch']])(
    '[version-bump] knows %s as a bump',
    (value) => {
      expect(isVersionBump(value)).toBe(true)
    }
  )

  it.each([[''], ['huge'], ['Major']])(
    '[version-bump] does not know %j as a bump',
    (value) => {
      expect(isVersionBump(value)).toBe(false)
    }
  )
})
