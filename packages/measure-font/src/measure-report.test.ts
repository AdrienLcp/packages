import { describe, expect, it } from 'vitest'

import type { FallbackMeasure, WeightMeasure } from './fallback-measure.ts'
import type { LineBound } from './line-bounds.ts'
import { measureReport, measureWarnings } from './measure-report.ts'

const weight = (overrides: Partial<WeightMeasure> = {}): WeightMeasure => ({
  bounds: null,
  face: 'onest-latin.woff2',
  fallback: 'Arial',
  figures: null,
  plainFigures: 1.03,
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
  sizeAdjust: 1.052039,
  sizeAdjustFrom: 'given',
  uniformFigures: null,
  unused: [],
  weights: [weight()],
  ...overrides
})

const bound = (kind: LineBound['kind'], ratio: number, text: string) => ({
  kind,
  line: { box: 10, text },
  ratio
})

describe('measureReport', () => {
  it('[report] reads one line per weight, then where each number came from', () => {
    expect(
      measureReport(
        measure({
          givenMetrics: ['ascent'],
          missing: ['漢'],
          unused: ['onest-latin-ext.woff2'],
          weights: [weight({ figures: 0.9 })]
        })
      )
    ).toEqual([
      'onest-latin.woff2 at 400: zero 0.665em, width ratio 1.023, figures ratio 0.9 over Arial',
      'cap height from the OS/2 table',
      'ascent 0.97, as given',
      'size-adjust 1.052039, as given',
      'left out, drawn by no file: 漢',
      'onest-latin-ext.woff2 draws none of the text; its subsets draw it'
    ])
  })

  it('[report] gives the range the edge lines allow, and what it writes', () => {
    const [first] = measureReport(
      measure({
        weights: [
          weight({
            bounds: {
              lines: [
                bound('at-least', 1.0041, 'Print'),
                bound('below', 1.0091, 'Sheet')
              ],
              lower: 1.0041,
              upper: 1.0091
            },
            ratio: 1.012,
            written: 1.009
          })
        ]
      })
    ).slice(1)
    expect(first).toBe(
      '  1.0041 ≤ ratio < 1.0091 keeps its 2 lines wrapped as the web font wraps them: writes 1.009'
    )
  })

  it('[report] names the two lines no ratio keeps', () => {
    const [first] = measureReport(
      measure({
        weights: [
          weight({
            bounds: {
              lines: [
                bound('at-least', 1.01, 'Print'),
                bound('below', 1.005, 'Sheet')
              ],
              lower: 1.01,
              upper: 1.005
            }
          })
        ]
      })
    ).slice(1)
    expect(first).toBe(
      '  no ratio keeps its 2 lines wrapped: "Print" must fit from 1.01, "Sheet" must wrap below 1.005'
    )
  })

  it('[report] reads the cap height from the H when the table has none, and fontaine size-adjust', () => {
    const lines = measureReport(
      measure({
        metrics: { ...measure().metrics, capHeightFrom: 'H' },
        sizeAdjustFrom: 'first-file',
        weights: [weight({ ratio: null, written: null })]
      })
    )
    expect(lines).toContain(
      'cap height from the H outline (the OS/2 table has none)'
    )
    expect(lines).toContain(
      "size-adjust 1.052039, fontaine's, computed from the first file"
    )
    expect(lines[0]).toBe('onest-latin.woff2 at 400: zero 0.665em over Arial')
  })
})

describe('measureWarnings', () => {
  it('[report] warns that ratios over the default pangram are not the app’s', () => {
    expect(measureWarnings(measure(), { defaultText: true })).toEqual([
      "width ratios over the default pangram: measure the app's own text (--text, --text-from, --text-from-dist) before writing them"
    ])
    expect(
      measureWarnings(measure({ figuresOnly: true }), { defaultText: true })
    ).toEqual([])
  })

  it('[report] warns when the digits stand more than 10 % off the letters', () => {
    const [unasked] = measureWarnings(
      measure({ weights: [weight({ plainFigures: 1.15, ratio: 1 })] }),
      { defaultText: false }
    )
    expect(unasked).toBe(
      'at 400 the digits set 15 % off the letters in a face scaled on them: measure them with --figures for a face of their own'
    )
    const [asked] = measureWarnings(
      measure({ weights: [weight({ figures: 0.86, ratio: 1 })] }),
      { defaultText: false }
    )
    expect(asked).toMatch(
      /^at 400 the digits stand 14 % off the letters: keep \$figures/
    )
    expect(
      measureWarnings(
        measure({ weights: [weight({ figures: 0.95, ratio: 1 })] }),
        {
          defaultText: false
        }
      )
    ).toEqual([])
  })

  it('[report] warns of lines no ratio keeps, and of typo metrics a browser may use', () => {
    const warnings = measureWarnings(
      measure({
        metrics: { ...measure().metrics, typo: { ascent: 0.8, descent: 0.2 } },
        weights: [
          weight({
            bounds: {
              lines: [],
              lower: 1.01,
              upper: 1.005
            }
          })
        ]
      }),
      { defaultText: false }
    )
    expect(warnings).toEqual([
      "at 400 no ratio keeps every line: the include writes the text's ratio",
      "the font sets USE_TYPO_METRICS: a browser that honours it draws the line box from ascent 0.8 and descent 0.2, not hhea's — pass them with --ascent and --descent to match it"
    ])
  })
})
