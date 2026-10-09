import { describe, expect, it } from 'vitest'

import {
  type FallbackMeasureInput,
  measureFallbackFaces
} from './fallback-measure.ts'
import { textWidth } from './font-metrics.ts'
import { servedFaces, servedTextWidth } from './served-face.ts'
import { openTestFont, testFace } from './test-fonts.fixture.ts'

const TEXT = 'The quick brown fox jumps over the lazy dog'

const [onest, jetBrainsMono, barlowBold] = await Promise.all([
  openTestFont('onest-latin.woff2'),
  openTestFont('jetbrains-mono-latin.woff2'),
  openTestFont('barlow-latin-700-normal.woff2')
])
const onestFace = await testFace('onest-latin.woff2')

const measureWith = (input: Partial<FallbackMeasureInput>) =>
  measureFallbackFaces({
    bold: onest,
    boldFrom: 650,
    faces: [onestFace],
    regular: jetBrainsMono,
    text: TEXT,
    weights: [400, 700],
    ...input
  })

const measured = async (input: Partial<FallbackMeasureInput> = {}) => {
  const measure = await measureWith(input)
  if (measure.status === 'failure')
    throw new Error(`measure failed: ${measure.error.reason}`)
  return measure.data
}

describe('measureFallbackFaces', () => {
  it('[fallback-measure] measures a variable file at each weight, over the bold cut from the bold band', async () => {
    const result = await measured({ sizeAdjust: 0.9 })
    expect(result.sizeAdjustFrom).toBe('given')
    expect(
      result.weights.map(({ fallback, weight }) => ({ fallback, weight }))
    ).toEqual([
      { fallback: 'JetBrains Mono Regular', weight: 400 },
      { fallback: 'Onest Regular', weight: 700 }
    ])
    const ratio =
      (textWidth(onest, TEXT) * 0.9) / textWidth(onest, TEXT, { weight: 700 })
    expect(result.weights[1]?.ratio).toBeCloseTo(ratio, 10)
    expect(result.weights[1]?.written).toBe(Number(ratio.toFixed(4)))
  })

  it('[fallback-measure] computes fontaine size-adjust from the first file when none is given', async () => {
    expect((await measured()).sizeAdjustFrom).toBe('first-file')
  })

  it('[fallback-measure] measures nothing without a face, or over a text of spaces alone', async () => {
    expect(await measureWith({ faces: [] })).toEqual({
      error: { reason: 'no-face' },
      status: 'failure'
    })
    expect(await measureWith({ text: ' \n\t ' })).toEqual({
      error: { reason: 'empty-text' },
      status: 'failure'
    })
  })

  it('[fallback-measure] collapses spaces and newlines as a browser lays the text out', async () => {
    const raw = await measured({ text: `\n${TEXT.replaceAll(' ', '\n')}\n` })
    expect(raw.weights[0]?.ratio).toBe((await measured()).weights[0]?.ratio)
  })

  it('[fallback-measure] measures the digits apart only when asked, with their features', async () => {
    expect((await measured()).weights[0]?.figures).toBeNull()
    const result = await measured({
      figures: { features: ['tnum'], only: false, separators: false }
    })
    expect(result.weights[1]?.figures).toBeCloseTo(
      (textWidth(onest, '0123456789', { features: ['tnum'] }) *
        result.sizeAdjust) /
        textWidth(onest, '0123456789', { features: ['tnum'], weight: 700 }),
      10
    )
  })

  it('[fallback-measure] measures the separators with the digits when asked', async () => {
    const result = await measured({
      figures: { features: [], only: false, separators: true }
    })
    expect(result.weights[0]?.figures).toBeCloseTo(
      (textWidth(jetBrainsMono, '0123456789:.,') * result.sizeAdjust) /
        textWidth(onest, '0123456789:.,'),
      10
    )
  })

  it('[fallback-measure] measures the digits alone, with no text at all', async () => {
    const result = await measured({
      figures: { features: [], only: true, separators: false },
      text: ''
    })
    expect(result.figuresOnly).toBe(true)
    expect(
      result.weights.map(({ ratio, written }) => [ratio, written])
    ).toEqual([
      [null, null],
      [null, null]
    ])
  })

  it('[fallback-measure] gives one figures ratio when every weight shares it', async () => {
    const monospace = await testFace('jetbrains-mono-latin.woff2')
    const result = await measured({
      bold: jetBrainsMono,
      faces: [monospace],
      figures: { features: [], only: true, separators: false },
      weights: [400, 700]
    })
    expect(result.uniformFigures).toBeCloseTo(1, 10)
  })

  it('[fallback-measure] measures a face served as subsets as one font', async () => {
    const subsets = await testFace('onest-latin.woff2', 'onest-latin-ext.woff2')
    const result = await measured({
      faces: [subsets],
      sizeAdjust: 1,
      text: `${TEXT} Łódź 漢`
    })
    expect(result.weights[0]?.face).toBe(
      'onest-latin.woff2 + onest-latin-ext.woff2'
    )
    expect(result.weights[0]?.ratio).toBeCloseTo(
      textWidth(jetBrainsMono, `${TEXT} Łódź `) /
        servedTextWidth(subsets, `${TEXT} Łódź `),
      10
    )
    expect(result.missing).toEqual(['漢'])
    expect(result.unused).toEqual([])
  })

  it('[fallback-measure] refuses a face that draws none of the text', async () => {
    expect(
      await measureWith({ faces: [await testFace('onest-latin-ext.woff2')] })
    ).toEqual({
      error: {
        face: 'onest-latin-ext.woff2',
        reason: 'no-glyph',
        text: 'text'
      },
      status: 'failure'
    })
  })

  it('[fallback-measure] refuses digits set with a feature the file lacks', async () => {
    expect(
      await measureWith({
        faces: [await testFace('libre-franklin-latin-400-normal.woff2')],
        figures: { features: ['tnum'], only: false, separators: false }
      })
    ).toEqual({
      error: {
        features: ['tnum'],
        file: 'libre-franklin-latin-400-normal.woff2',
        reason: 'missing-feature'
      },
      status: 'failure'
    })
  })

  it('[fallback-measure] reads another axis, and refuses a face without it', async () => {
    const archivo = await testFace('archivo-latin-700-wdth.woff2')
    const normal = await measured({ faces: [archivo], sizeAdjust: 1 })
    const condensed = await measured({
      axes: { wdth: 70 },
      faces: [archivo],
      sizeAdjust: 1
    })
    expect(condensed.axes).toEqual({ wdth: 70 })
    expect(condensed.weights[0]?.ratio).toBeGreaterThan(
      1.2 * (normal.weights[0]?.ratio ?? 0)
    )
    expect(await measureWith({ axes: { wdth: 70 } })).toEqual({
      error: {
        axis: 'wdth',
        face: 'onest-latin.woff2',
        reason: 'missing-axis'
      },
      status: 'failure'
    })
  })

  it('[fallback-measure] refuses two faces at one weight', async () => {
    const faces = servedFaces([
      { font: onest, name: 'onest.woff2' },
      { font: jetBrainsMono, name: 'mono.woff2' }
    ])
    expect(await measureWith({ faces, weights: [] })).toEqual({
      error: {
        faces: ['onest.woff2', 'mono.woff2'],
        reason: 'duplicate-weight',
        weight: 400
      },
      status: 'failure'
    })
  })

  it('[fallback-measure] takes ascent and descent by hand', async () => {
    const result = await measured({ metrics: { ascent: 0.9 } })
    expect(result.metrics).toMatchObject({ ascent: 0.9, descent: 0.305 })
    expect(result.givenMetrics).toEqual(['ascent'])
  })

  describe('edge lines', () => {
    const line = 'Print the family sheet'
    const webAt400 = textWidth(onest, line, { weight: 400 })

    it('[fallback-measure] bounds each band by the lines set at its weight', async () => {
      const result = await measured({
        lines: [
          { box: webAt400 * 1.001, text: line },
          { box: webAt400 * 1.001, text: line, weight: 700 }
        ]
      })
      expect(result.weights[0]?.bounds?.lines).toHaveLength(1)
      expect(result.weights[0]?.bounds?.lower).toBeCloseTo(
        (textWidth(jetBrainsMono, line) * result.sizeAdjust) /
          (webAt400 * 1.001),
        10
      )
      expect(result.weights[1]?.bounds).toMatchObject({
        lower: null,
        upper: expect.any(Number)
      })
    })

    it('[fallback-measure] writes a ratio that keeps every line wrapped as the web font wraps it', async () => {
      const { weights } = await measured({
        lines: [{ box: webAt400 * 0.999, text: line }],
        text: 'iiiiiiii'
      })
      const [regular] = weights
      const upper = regular?.bounds?.upper ?? 0
      expect(regular?.ratio).toBeGreaterThan(upper)
      expect(regular?.written).toBeLessThan(upper)
      expect(regular?.written).toBeGreaterThan(upper - 0.0001)
    })

    it('[fallback-measure] refuses a line set at a weight not measured', async () => {
      expect(
        await measureWith({ lines: [{ box: 10, text: line, weight: 300 }] })
      ).toEqual({
        error: { reason: 'unmeasured-line-weight', weight: 300 },
        status: 'failure'
      })
    })
  })

  it('[fallback-measure] measures each static face at its own weight', async () => {
    const faces = servedFaces([
      { font: onest, name: 'onest.woff2' },
      { font: barlowBold, name: 'barlow-700.woff2' }
    ])
    const result = await measured({ faces, weights: [] })
    expect(result.weights.map(({ face, weight }) => [face, weight])).toEqual([
      ['onest.woff2', 400],
      ['barlow-700.woff2', 700]
    ])
  })
})
