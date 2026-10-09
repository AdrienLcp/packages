import { describe, expect, it } from 'vitest'

import {
  DIGITS,
  figuresText,
  uniformFiguresRatio,
  unsupportedFigureFeatures
} from './figures.ts'
import { testFace } from './test-fonts.fixture.ts'

describe('figuresText', () => {
  it('[figures] is the digits, and their separators when asked', () => {
    expect(figuresText(false)).toBe(DIGITS)
    expect(figuresText(true)).toBe('0123456789:.,')
  })
})

describe('unsupportedFigureFeatures', () => {
  it('[figures] names a file that lacks a feature the digits are set with', async () => {
    const libreFranklin = await testFace(
      'libre-franklin-latin-400-normal.woff2'
    )
    expect(unsupportedFigureFeatures(libreFranklin, ['tnum'])).toEqual([
      { features: ['tnum'], file: 'libre-franklin-latin-400-normal.woff2' }
    ])
  })

  it('[figures] passes a file that has the features', async () => {
    const barlow = await testFace('barlow-latin-700-normal.woff2')
    expect(unsupportedFigureFeatures(barlow, ['tnum'])).toEqual([])
  })

  it('[figures] passes tnum on digits that already share one advance', async () => {
    const jetBrainsMono = await testFace('jetbrains-mono-latin.woff2')
    expect(unsupportedFigureFeatures(jetBrainsMono, ['tnum'])).toEqual([])
    expect(unsupportedFigureFeatures(jetBrainsMono, ['onum'])).toHaveLength(1)
  })

  it('[figures] reads only the subsets that draw digits', async () => {
    const onest = await testFace('onest-latin.woff2', 'onest-latin-ext.woff2')
    expect(unsupportedFigureFeatures(onest, ['tnum'])).toEqual([])
  })
})

describe('uniformFiguresRatio', () => {
  it('[figures] is the mean of ratios that spread less than 0.1 %', () => {
    expect(uniformFiguresRatio([1, 1.0009])).toBeCloseTo(1.00045, 10)
  })

  it('[figures] is null for ratios that differ, or none', () => {
    expect(uniformFiguresRatio([1, 1.0011])).toBeNull()
    expect(uniformFiguresRatio([])).toBeNull()
  })
})
