import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { findArialFile } from './arial-files.ts'
import {
  fontaineSizeAdjust,
  type OpenedFont,
  openFont,
  textWidth,
  verticalMetrics,
  widthRatio,
  zeroWidth
} from './font-metrics.ts'

const TEXT = 'The quick brown fox jumps over the lazy dog'

const open = async (name: string) => {
  const opened = await openFont(
    readFileSync(new URL(`test-fonts/${name}`, import.meta.url))
  )
  if (opened.status === 'failure') throw new Error(`${name}: ${opened.error}`)
  return opened.data
}

const onest = await open('onest-latin.woff2')
const jetBrainsMono = await open('jetbrains-mono-latin.woff2')

describe('openFont', () => {
  it('[font-metrics] reads a variable woff2 with its weight axis', () => {
    expect(onest.weightAxis).toEqual({
      default: 400,
      max: 900,
      min: 100,
      name: 'Weight'
    })
    expect(onest.weight).toBe(400)
    expect(onest.italic).toBe(false)
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
    expect(zeroWidth(jetBrainsMono, 800)).toBe(0.6)
  })

  it('[font-metrics] follows the weight axis of a variable font', () => {
    expect(zeroWidth(onest, 400)).toBeCloseTo(0.665, 4)
    expect(zeroWidth(onest, 800)).toBeCloseTo(0.6586, 4)
  })
})

describe('textWidth', () => {
  it('[font-metrics] sets a heavier weight wider', () => {
    expect(textWidth(onest, TEXT, 800)).toBeGreaterThan(
      textWidth(onest, TEXT, 400)
    )
  })
})

describe('widthRatio', () => {
  it('[font-metrics] is 1 for a font over itself, scaled by its own size-adjust', async () => {
    const sizeAdjust = await fontaineSizeAdjust(onest, onest)
    expect(sizeAdjust).toBe(1)
    expect(
      widthRatio({ fallback: onest, font: onest, sizeAdjust, text: TEXT })
    ).toBe(1)
  })

  it('[font-metrics] is the fallback width scaled by size-adjust over the web font width', () => {
    const sizeAdjust = 0.9
    expect(
      widthRatio({
        fallback: jetBrainsMono,
        font: onest,
        sizeAdjust,
        text: TEXT,
        weight: 700
      })
    ).toBeCloseTo(
      (textWidth(jetBrainsMono, TEXT) * sizeAdjust) /
        textWidth(onest, TEXT, 700),
      10
    )
  })
})

describe('verticalMetrics', () => {
  it('[font-metrics] reads ascent and descent from hhea and the capital height from OS/2', () => {
    expect(verticalMetrics(onest)).toEqual({
      ascent: 0.97,
      capHeight: 707 / 1000,
      capHeightFrom: 'OS/2',
      descent: 0.305
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
    const barlowBold = await open('barlow-latin-700-normal.woff2')
    expect(barlowBold.weightAxis).toBeNull()
    expect(barlowBold.weight).toBe(700)
    expect(zeroWidth(barlowBold, 400)).toBe(zeroWidth(barlowBold))
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
})
