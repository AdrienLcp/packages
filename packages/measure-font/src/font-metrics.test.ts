import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { findArialFile } from './arial-files.ts'
import {
  atVariation,
  fontaineSizeAdjust,
  missingFeatures,
  type OpenedFont,
  openFont,
  textWidth,
  verticalMetrics,
  zeroWidth
} from './font-metrics.ts'
import { openTestFont } from './test-fonts.fixture.ts'

const TEXT = 'The quick brown fox jumps over the lazy dog'

const [onest, jetBrainsMono, archivoBold, libreFranklin] = await Promise.all([
  openTestFont('onest-latin.woff2'),
  openTestFont('jetbrains-mono-latin.woff2'),
  openTestFont('archivo-latin-700-wdth.woff2'),
  openTestFont('libre-franklin-latin-400-normal.woff2')
])

describe('openFont', () => {
  it('[font-metrics] reads a variable woff2 with its weight axis', () => {
    expect(onest.weightAxis).toEqual({ default: 400, max: 900, min: 100 })
    expect(onest.axes).toEqual({ wght: { default: 400, max: 900, min: 100 } })
    expect(onest.weight).toBe(400)
    expect(onest.italic).toBe(false)
  })

  it('[font-metrics] reads a width axis, and the weight of a file without a weight axis', () => {
    expect(archivoBold.axes).toEqual({
      wdth: { default: 100, max: 125, min: 62 }
    })
    expect(archivoBold.weightAxis).toBeNull()
    expect(archivoBold.weight).toBe(700)
  })

  it('[font-metrics] refuses what is not a font', async () => {
    expect(
      await openFont(new TextEncoder().encode('not a font at all'))
    ).toEqual({
      error: 'unreadable',
      status: 'failure'
    })
  })
})

describe('zeroWidth', () => {
  it('[font-metrics] is the zero advance in em, the same at every weight of a monospace', () => {
    expect(zeroWidth(jetBrainsMono)).toBe(0.6)
    expect(zeroWidth(jetBrainsMono, { weight: 800 })).toBe(0.6)
  })

  it('[font-metrics] follows the weight axis of a variable font', () => {
    expect(zeroWidth(onest, { weight: 400 })).toBeCloseTo(0.665, 4)
    expect(zeroWidth(onest, { weight: 800 })).toBeCloseTo(0.6586, 4)
  })
})

describe('textWidth', () => {
  it('[font-metrics] sets a heavier weight wider', () => {
    expect(textWidth(onest, TEXT, { weight: 800 })).toBeGreaterThan(
      textWidth(onest, TEXT, { weight: 400 })
    )
  })

  it('[font-metrics] sets a condensed width narrower, and ignores an axis the file lacks', () => {
    expect(textWidth(archivoBold, TEXT, { axes: { wdth: 70 } })).toBeLessThan(
      0.8 * textWidth(archivoBold, TEXT)
    )
    expect(textWidth(onest, TEXT, { axes: { wdth: 70 } })).toBe(
      textWidth(onest, TEXT)
    )
  })

  it('[font-metrics] reads one instance per variation', () => {
    expect(atVariation(onest, { weight: 700 })).toBe(
      atVariation(onest, { weight: 700 })
    )
    expect(atVariation(onest)).toBe(onest.font)
  })
})

describe('missingFeatures', () => {
  it('[font-metrics] lists the features a file holds no lookup for', () => {
    expect(missingFeatures(onest, ['tnum', 'lnum'])).toEqual(['lnum'])
    expect(missingFeatures(libreFranklin, ['tnum'])).toEqual(['tnum'])
  })
})

describe('fontaineSizeAdjust', () => {
  it('[font-metrics] is 1 for a font over itself', async () => {
    expect(await fontaineSizeAdjust(onest, onest)).toBe(1)
  })
})

describe('verticalMetrics', () => {
  it('[font-metrics] reads ascent and descent from hhea and the capital height from OS/2', () => {
    expect(verticalMetrics(onest)).toEqual({
      ascent: 0.97,
      capHeight: 707 / 1000,
      capHeightFrom: 'OS/2',
      descent: 0.305,
      typo: null
    })
  })

  it('[font-metrics] measures the H when the OS/2 table has no capital height', () => {
    const font = new Proxy(onest.font, {
      get: (target, property, receiver) =>
        property === 'OS/2'
          ? { ...target['OS/2'], capHeight: 0, version: 1 }
          : Reflect.get(target, property, receiver)
    })
    const withoutCapHeight: OpenedFont = { ...onest, font }
    const { capHeight, capHeightFrom } = verticalMetrics(withoutCapHeight)
    expect(capHeightFrom).toBe('H')
    expect(capHeight).toBeCloseTo(707 / 1000, 2)
  })

  it('[font-metrics] gives the typo metrics a font tells browsers to use instead of hhea', () => {
    const font = new Proxy(onest.font, {
      get: (target, property, receiver) =>
        property === 'OS/2'
          ? {
              ...target['OS/2'],
              fsSelection: {
                ...target['OS/2'].fsSelection,
                useTypoMetrics: true
              },
              typoAscender: 800,
              typoDescender: -200
            }
          : Reflect.get(target, property, receiver)
    })
    expect(verticalMetrics({ ...onest, font }).typo).toEqual({
      ascent: 0.8,
      descent: 0.2
    })
  })
})

describe('findArialFile', () => {
  it('[font-metrics] takes the first candidate that exists, or none', () => {
    const here = fileURLToPath(
      new URL('test-fonts/onest-latin.woff2', import.meta.url)
    )
    expect(findArialFile('regular', ['/nowhere/arial.ttf', here])).toBe(here)
    expect(findArialFile('bold', ['/nowhere/arialbd.ttf'])).toBeNull()
  })
})

describe('openFont formats', () => {
  it('[font-metrics] reads a static file at the weight it declares', async () => {
    const barlowBold = await openTestFont('barlow-latin-700-normal.woff2')
    expect(barlowBold.weightAxis).toBeNull()
    expect(barlowBold.weight).toBe(700)
    expect(zeroWidth(barlowBold, { weight: 400 })).toBe(zeroWidth(barlowBold))
  })

  it('[font-metrics] reads a ttf as it is', async () => {
    const opened = await openFont(onest.bytes)
    expect(opened.status === 'success' && opened.data.font.familyName).toBe(
      'Onest'
    )
  })

  it('[font-metrics] refuses a font collection', async () => {
    const header = new Uint8Array([
      ...new TextEncoder().encode('ttcf'),
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      16
    ])
    expect(await openFont(header)).toEqual({
      error: 'collection',
      status: 'failure'
    })
  })

  it('[font-metrics] opens woff2 files side by side without mixing their bytes', async () => {
    const [first, second] = await Promise.all([
      openFont(
        readFileSync(new URL('test-fonts/onest-latin.woff2', import.meta.url))
      ),
      openFont(
        readFileSync(
          new URL('test-fonts/jetbrains-mono-latin.woff2', import.meta.url)
        )
      )
    ])
    expect(first?.status === 'success' && first.data.font.familyName).toBe(
      'Onest'
    )
    expect(second?.status === 'success' && second.data.font.familyName).toBe(
      'JetBrains Mono'
    )
  })
})
