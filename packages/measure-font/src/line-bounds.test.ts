import { describe, expect, it } from 'vitest'

import { textWidth } from './font-metrics.ts'
import {
  isEmptyRange,
  type LineBound,
  lineBound,
  ratioBounds,
  ratioWithin
} from './line-bounds.ts'
import { servedTextWidth } from './served-face.ts'
import { openTestFont, testFace } from './test-fonts.fixture.ts'

const LINE = 'Print the family sheet'
const SIZE_ADJUST = 0.95

const [face, arial] = await Promise.all([
  testFace('onest-latin.woff2'),
  openTestFont('jetbrains-mono-latin.woff2')
])
const webWidth = servedTextWidth(face, LINE, { weight: 700 })
const arialWidth = textWidth(arial, LINE)

const boundFor = (box: number, letterSpacing?: number) =>
  lineBound({
    face,
    fallback: arial,
    line: { box, letterSpacing, text: LINE, weight: 700 },
    sizeAdjust: SIZE_ADJUST,
    variation: { weight: 700 }
  })

describe('lineBound', () => {
  it('[line-bounds] asks the fallback to fit a line the web font fits', () => {
    const box = webWidth * 1.001
    expect(boundFor(box)).toMatchObject({ kind: 'at-least' })
    expect(boundFor(box)?.ratio).toBeCloseTo(
      (arialWidth * SIZE_ADJUST) / box,
      10
    )
  })

  it('[line-bounds] asks the fallback to wrap a line the web font wraps', () => {
    expect(boundFor(webWidth * 0.999)).toMatchObject({ kind: 'below' })
  })

  it('[line-bounds] adds the letter spacing to both faces', () => {
    const spacing = 0.05 * LINE.length
    const box = (webWidth + spacing) * 1.001
    expect(boundFor(box, 0.05)).toMatchObject({ kind: 'at-least' })
    expect(boundFor(box, 0.05)?.ratio).toBeCloseTo(
      (arialWidth * SIZE_ADJUST) / (box - spacing),
      10
    )
  })

  it('[line-bounds] sets no bound when the spacing alone fills the box', () => {
    expect(boundFor(1, 1)).toBeNull()
  })
})

const bound = (kind: LineBound['kind'], ratio: number): LineBound => ({
  kind,
  line: { box: 10, text: `${kind} ${ratio}` },
  ratio
})

describe('ratioBounds', () => {
  it('[line-bounds] keeps the tightest bound on each side', () => {
    const bounds = ratioBounds([
      bound('at-least', 1.002),
      bound('below', 1.01),
      bound('at-least', 1.0041),
      bound('below', 1.0091)
    ])
    expect(bounds).toMatchObject({ lower: 1.0041, upper: 1.0091 })
    expect(bounds.lines.map(({ ratio }) => ratio)).toEqual([
      1.0041, 1.002, 1.0091, 1.01
    ])
    expect(isEmptyRange(bounds)).toBe(false)
  })

  it('[line-bounds] leaves an end open when no line bounds it', () => {
    expect(ratioBounds([bound('below', 1.01)])).toMatchObject({
      lower: null,
      upper: 1.01
    })
  })

  it('[line-bounds] is empty when a line that must fit is wider than one that must wrap', () => {
    expect(
      isEmptyRange(
        ratioBounds([bound('at-least', 1.01), bound('below', 1.005)])
      )
    ).toBe(true)
  })
})

describe('ratioWithin', () => {
  const range = (lower: number | null, upper: number | null) => ({
    lines: [],
    lower,
    upper
  })

  it('[line-bounds] keeps the text ratio, rounded, when it keeps every line', () => {
    expect(ratioWithin(range(1.0041, 1.0091), 1.00723)).toBe(1.0072)
  })

  it('[line-bounds] moves the ratio to the nearest value that keeps every line', () => {
    expect(ratioWithin(range(1.00412, 1.0091), 1.002)).toBe(1.0042)
    expect(ratioWithin(range(1.0041, 1.004), 1.002)).toBe(1.002)
    expect(ratioWithin(range(1.0, 1.00403), 1.0072)).toBe(1.004)
    expect(ratioWithin(range(1.0, 1.004), 1.0072)).toBe(1.0039)
  })

  it('[line-bounds] takes more decimals for a range narrower than the fourth', () => {
    expect(ratioWithin(range(1.00412, 1.00418), 1.0072)).toBe(1.00417)
  })
})
