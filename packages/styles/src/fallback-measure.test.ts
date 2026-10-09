import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  collapseWhiteSpace,
  type FallbackMeasureInput,
  fallbackFacesInclude,
  measureFallbackFaces,
  measureReport
} from './fallback-measure.ts'
import { openFont, textWidth } from './font-metrics.ts'

const TEXT = 'The quick brown fox jumps over the lazy dog'

const open = async (name: string) => {
  const opened = await openFont(
    readFileSync(new URL(`test-fonts/${name}`, import.meta.url))
  )
  if (opened.status === 'failure') throw new Error(`${name}: ${opened.error}`)
  return opened.data
}

const [onest, jetBrainsMono] = await Promise.all([
  open('onest-latin.woff2'),
  open('jetbrains-mono-latin.woff2')
])

describe('openFont', () => {
  it('[fallback-measure] opens woff2 files side by side without mixing their bytes', () => {
    expect(onest.font.familyName).toBe('Onest')
    expect(jetBrainsMono.font.familyName).toBe('JetBrains Mono')
  })
})

describe('measureFallbackFaces', () => {
  const measureWith = (input: Partial<FallbackMeasureInput>) =>
    measureFallbackFaces({
      bold: onest,
      boldFrom: 650,
      files: [{ font: onest, name: 'onest-latin.woff2' }],
      regular: jetBrainsMono,
      text: TEXT,
      weights: [400, 700],
      ...input
    })
  const measure = (sizeAdjust?: number) => measureWith({ sizeAdjust })

  it('[fallback-measure] measures a variable file at each weight, over the bold cut from the bold band', async () => {
    const result = await measure(0.9)
    expect(result?.sizeAdjustFrom).toBe('given')
    expect(
      result?.weights.map(({ fallback, weight }) => ({ fallback, weight }))
    ).toEqual([
      { fallback: 'JetBrains Mono Regular', weight: 400 },
      { fallback: 'Onest Regular', weight: 700 }
    ])
    expect(result?.weights[1]?.ratio).toBeCloseTo(
      (textWidth(onest, TEXT) * 0.9) / textWidth(onest, TEXT, 700),
      10
    )
  })

  it('[fallback-measure] computes fontaine size-adjust from the first file when none is given', async () => {
    expect((await measure())?.sizeAdjustFrom).toBe('first-file')
  })

  it('[fallback-measure] measures nothing without a file', async () => {
    expect(
      await measureFallbackFaces({
        bold: onest,
        boldFrom: 650,
        files: [],
        regular: onest,
        text: TEXT,
        weights: []
      })
    ).toBeNull()
  })

  it('[fallback-measure] collapses spaces and newlines as a browser lays the text out', async () => {
    expect(collapseWhiteSpace('\n  The quick\n\tbrown  fox \n')).toBe(
      'The quick brown fox'
    )
    const raw = await measureWith({
      text: `\n${TEXT.replaceAll(' ', '\n')}\n`
    })
    const laidOut = await measure()
    expect(raw?.weights[0]?.ratio).toBe(laidOut?.weights[0]?.ratio)
  })

  it('[fallback-measure] measures nothing over a text of spaces alone', async () => {
    expect(await measureWith({ text: ' \n\t ' })).toBeNull()
  })

  it('[fallback-measure] measures the digits apart only when asked, with their features', async () => {
    expect((await measure())?.weights[0]?.figures).toBeNull()
    const result = await measureWith({ figures: { features: ['tnum'] } })
    expect(result?.weights[1]?.figures).toBeCloseTo(
      (textWidth(onest, '0123456789', 400, ['tnum']) *
        (result?.sizeAdjust ?? 0)) /
        textWidth(onest, '0123456789', 700, ['tnum']),
      10
    )
    if (result === null) throw new Error('no measure')
    expect(fallbackFacesInclude('Onest', result)).toMatch(
      /, \$figures: \(400: [\d.]+, 700: [\d.]+\)\)$/
    )
    expect(measureReport(result)[0]).toMatch(
      /width ratio [\d.]+, figures ratio [\d.]+ over/
    )
  })

  it('[fallback-measure] writes the include and the report', async () => {
    const result = await measure(1.052039)
    if (result === null) throw new Error('no measure')
    expect(fallbackFacesInclude('Onest', result, { italic: true })).toMatch(
      /^@include fonts\.fallback-faces\('Onest', \(ascent: 0\.97, descent: 0\.305, cap-height: 0\.707\), 1\.052039, \(400: [\d.]+, 700: [\d.]+\), \$style: italic\)$/
    )
    expect(measureReport(result)).toEqual([
      expect.stringMatching(
        /^onest-latin\.woff2 at 400: zero 0\.665em, width ratio [\d.]+ over JetBrains Mono Regular$/
      ),
      expect.stringMatching(/^onest-latin\.woff2 at 700: zero 0\.66\d*em/),
      'cap height from the OS/2 table',
      'size-adjust 1.052039, as given'
    ])
  })
})
