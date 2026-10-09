import { describe, expect, it } from 'vitest'

import { textWidth } from './font-metrics.ts'
import { coverageOf, servedFaces, servedTextWidth } from './served-face.ts'
import { openTestFont, testFace } from './test-fonts.fixture.ts'

const [latin, latinExt, barlowBold] = await Promise.all([
  openTestFont('onest-latin.woff2'),
  openTestFont('onest-latin-ext.woff2'),
  openTestFont('barlow-latin-700-normal.woff2')
])

describe('servedFaces', () => {
  it('[served-face] groups the unicode-range subsets of one face, in the order files come', () => {
    const faces = servedFaces([
      { font: latin, name: 'onest-latin.woff2' },
      { font: barlowBold, name: 'barlow-700.woff2' },
      { font: latinExt, name: 'onest-latin-ext.woff2' }
    ])
    expect(faces.map(({ name }) => name)).toEqual([
      'onest-latin.woff2 + onest-latin-ext.woff2',
      'barlow-700.woff2'
    ])
    expect(faces[0]).toMatchObject({
      family: 'Onest',
      italic: false,
      weight: 400,
      weightAxis: { default: 400, max: 900, min: 100 }
    })
  })
})

describe('coverageOf', () => {
  it('[served-face] draws each character from the first subset that has it', async () => {
    const face = await testFace('onest-latin.woff2', 'onest-latin-ext.woff2')
    const { drawn, missing, runs, unused } = coverageOf(face, 'Wał 漢 ok')
    expect(runs.map(({ file, text }) => [file.name, text])).toEqual([
      ['onest-latin.woff2', 'Wa'],
      ['onest-latin-ext.woff2', 'ł'],
      ['onest-latin.woff2', '  ok']
    ])
    expect(drawn).toBe('Wał  ok')
    expect(missing).toEqual(['漢'])
    expect(unused).toEqual([])
  })

  it('[served-face] names the subsets that draw none of the text', async () => {
    const face = await testFace('onest-latin.woff2', 'onest-latin-ext.woff2')
    expect(coverageOf(face, 'Hello').unused).toEqual(['onest-latin-ext.woff2'])
    const extOnly = await testFace('onest-latin-ext.woff2')
    expect(coverageOf(extOnly, 'Hello').drawn).toBe('')
  })
})

describe('servedTextWidth', () => {
  it('[served-face] sums the runs, each shaped in its own subset', async () => {
    const face = await testFace('onest-latin.woff2', 'onest-latin-ext.woff2')
    expect(servedTextWidth(face, 'Wał', { weight: 700 })).toBeCloseTo(
      textWidth(latin, 'Wa', { weight: 700 }) +
        textWidth(latinExt, 'ł', { weight: 700 }),
      10
    )
  })

  it('[served-face] measures a text one subset draws as that file alone', async () => {
    const face = await testFace('onest-latin.woff2', 'onest-latin-ext.woff2')
    expect(servedTextWidth(face, 'Hello world')).toBe(
      textWidth(latin, 'Hello world')
    )
  })
})
