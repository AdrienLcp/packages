import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  dictionaryMessages,
  messageText,
  readDictionaryText
} from './dictionary-text.ts'

const fixture = (name: string) =>
  fileURLToPath(new URL(`test-texts/${name}`, import.meta.url))

describe('messageText', () => {
  it('[dictionary-text] leaves out placeholders and rich text tags', () => {
    expect(messageText('Read the <link>terms</link>, {name}')).toBe(
      'Read the terms, '
    )
  })
})

describe('dictionaryMessages', () => {
  it('[dictionary-text] reads every leaf, and the plural forms and enum members of a translation', () => {
    expect(
      dictionaryMessages({
        nested: { title: 'Title' },
        score: [
          '{count:plural}',
          {
            number: { count: { style: 'percent' } },
            plural: {
              count: {
                formatter: { style: 'unit' },
                one: '{?} point',
                other: '{?} points',
                type: 'ordinal'
              }
            }
          }
        ],
        side: ['{side:enum}', { enum: { side: { left: 'Left' } } }]
      })
    ).toEqual(['Title', '', ' point', ' points', '', 'Left'])
  })

  it('[dictionary-text] reads the strings of an array of messages', () => {
    expect(dictionaryMessages({ count: 3, steps: ['One', 'Two'] })).toEqual([
      'One',
      'Two'
    ])
  })

  it('[dictionary-text] reads no alternative from a plural or an enum entry that is not a map', () => {
    expect(
      dictionaryMessages([
        'Score {count:plural}',
        { enum: { side: 'Left' }, plural: { count: 'points' } }
      ])
    ).toEqual(['Score '])
  })
})

describe('readDictionaryText', () => {
  it('[dictionary-text] reads a JSON dictionary, one message per line', async () => {
    expect(await readDictionaryText(fixture('en.json'))).toEqual({
      data: ' people\nYour family tree\nPrint the sheet',
      status: 'success'
    })
  })

  it('[dictionary-text] imports a TypeScript dictionary module', async () => {
    const read = await readDictionaryText(fixture('dictionary.fixture.ts'))
    expect(read.status === 'success' && read.data.split('\n')).toEqual([
      'Hello ',
      '',
      ' point',
      ' points',
      '',
      'Left',
      'Right'
    ])
  })

  it('[dictionary-text] refuses another kind of file, and one it cannot read', async () => {
    expect(await readDictionaryText(fixture('pages/index.html'))).toEqual({
      error: 'unsupported',
      status: 'failure'
    })
    expect(await readDictionaryText(fixture('nowhere.json'))).toEqual({
      error: 'unreadable',
      status: 'failure'
    })
  })
})
