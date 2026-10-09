import { describe, expect, it } from 'vitest'

import { fallbackFacesInclude } from './fallback-faces-include.ts'
import type { FallbackMeasure, WeightMeasure } from './fallback-measure.ts'

const weight = (overrides: Partial<WeightMeasure>): WeightMeasure => ({
  bounds: null,
  face: 'onest-latin.woff2',
  fallback: 'Arial',
  figures: null,
  plainFigures: 1,
  ratio: 1.02301,
  weight: 400,
  written: 1.023,
  zero: 0.665,
  ...overrides
})

const measure = (
  overrides: Partial<FallbackMeasure> = {}
): FallbackMeasure => ({
  axes: {},
  figuresOnly: false,
  givenMetrics: [],
  metrics: {
    ascent: 0.97,
    capHeight: 0.7,
    capHeightFrom: 'OS/2',
    descent: 0.305,
    typo: null
  },
  missing: [],
  sizeAdjust: 1.0520391,
  sizeAdjustFrom: 'first-file',
  uniformFigures: null,
  unused: [],
  weights: [
    weight({}),
    weight({ ratio: 1.0497, weight: 700, written: 1.0497 })
  ],
  ...overrides
})

describe('fallbackFacesInclude', () => {
  it('[include] writes one $widths entry per weight, from the written ratio', () => {
    expect(fallbackFacesInclude('Onest', measure())).toBe(
      "@include fonts.fallback-faces('Onest', (ascent: 0.97, descent: 0.305, cap-height: 0.7), 1.052039, (400: 1.023, 700: 1.0497))"
    )
  })

  it('[include] leaves a size-adjust of 1 to the mixin', () => {
    expect(fallbackFacesInclude('Onest', measure({ sizeAdjust: 1 }))).toBe(
      "@include fonts.fallback-faces('Onest', (ascent: 0.97, descent: 0.305, cap-height: 0.7), $widths: (400: 1.023, 700: 1.0497))"
    )
  })

  it('[include] writes $figures per weight, or once when every weight shares it', () => {
    const perWeight = measure({
      weights: [
        weight({ figures: 0.91234 }),
        weight({ figures: 0.95, weight: 700 })
      ]
    })
    expect(fallbackFacesInclude('Barlow', perWeight)).toMatch(
      /, \$figures: \(400: 0\.9123, 700: 0\.95\)\)$/
    )
    expect(
      fallbackFacesInclude('Barlow', { ...perWeight, uniformFigures: 0.93 })
    ).toMatch(/, \$figures: 0\.93\)$/)
  })

  it('[include] writes the separators, the stretch and the style it was measured with', () => {
    expect(
      fallbackFacesInclude(
        'Archivo',
        measure({ axes: { wdth: 70 }, uniformFigures: 0.9 }),
        { figureSeparators: true, italic: true }
      )
    ).toMatch(
      /, \$figures: 0\.9, \$figure-separators: true, \$stretch: 70%, \$style: italic\)$/
    )
  })

  it('[include] writes the $figures argument alone for the digits alone', () => {
    expect(
      fallbackFacesInclude(
        'Barlow',
        measure({
          figuresOnly: true,
          weights: [weight({ figures: 0.9, ratio: null, written: null })]
        }),
        { figureSeparators: true }
      )
    ).toBe('$figures: (400: 0.9), $figure-separators: true')
  })
})
