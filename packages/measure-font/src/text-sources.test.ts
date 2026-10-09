import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { DEFAULT_TEXT } from './measured-text.ts'
import { gatherText } from './text-sources.ts'

const fixture = (name: string) =>
  fileURLToPath(new URL(`test-texts/${name}`, import.meta.url))

describe('gatherText', () => {
  it('[text-sources] measures the default pangram when no source is given', async () => {
    expect(await gatherText({})).toEqual({
      data: { isDefault: true, text: DEFAULT_TEXT },
      status: 'success'
    })
  })

  it('[text-sources] reads every source, one per line, uppercased when asked', async () => {
    expect(
      await gatherText({
        dictionaries: [fixture('en.json')],
        dists: [fixture('pages')],
        select: 'h2',
        texts: ['déjà'],
        uppercase: true
      })
    ).toEqual({
      data: {
        isDefault: false,
        text: 'DÉJÀ\n PEOPLE\nYOUR FAMILY TREE\nPRINT THE SHEET\nABOUT'
      },
      status: 'success'
    })
  })

  it('[text-sources] reads a text file as it is', async () => {
    const read = await gatherText({ files: [fixture('lines.json')] })
    expect(read.status === 'success' && read.data.text).toContain('"Family"')
  })

  it('[text-sources] fails on the first source it cannot read', async () => {
    expect(await gatherText({ files: ['nowhere.txt'] })).toEqual({
      error: { path: 'nowhere.txt', reason: 'missing' },
      status: 'failure'
    })
    expect(
      await gatherText({ dictionaries: [fixture('pages/index.html')] })
    ).toMatchObject({ error: { reason: 'unsupported-dictionary' } })
    expect(
      await gatherText({ dictionaries: [fixture('pages')] })
    ).toMatchObject({ error: { reason: 'unsupported-dictionary' } })
    expect(
      await gatherText({ dists: [fixture('pages')], select: 'h1[' })
    ).toEqual({
      error: { reason: 'bad-selector', select: 'h1[' },
      status: 'failure'
    })
    expect(
      await gatherText({
        dists: [fileURLToPath(new URL('test-fonts', import.meta.url))]
      })
    ).toMatchObject({ error: { reason: 'no-html' } })
  })
})
