import { describe, expect, it } from 'vitest'

import { asShown, collapseWhiteSpace } from './measured-text.ts'

describe('collapseWhiteSpace', () => {
  it('[measured-text] collapses spaces and newlines as a browser lays the text out', () => {
    expect(collapseWhiteSpace('\n  The quick\n\tbrown  fox \n')).toBe(
      'The quick brown fox'
    )
  })
})

describe('asShown', () => {
  it('[measured-text] uppercases as text-transform does, ß to SS', () => {
    expect(asShown('Straße déjà', { uppercase: true })).toBe('STRASSE DÉJÀ')
    expect(asShown('istanbul', { locale: 'tr', uppercase: true })).toBe(
      'İSTANBUL'
    )
    expect(asShown('Straße', { uppercase: false })).toBe('Straße')
  })
})
