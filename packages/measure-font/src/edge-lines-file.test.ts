import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { parseEdgeLines, readEdgeLines } from './edge-lines-file.ts'

describe('readEdgeLines', () => {
  it('[edge-lines] reads each box in em of its font size', () => {
    expect(
      readEdgeLines(
        fileURLToPath(new URL('test-texts/lines.json', import.meta.url))
      )
    ).toEqual({
      data: [
        { box: 11.25, text: 'Print the family sheet', weight: 400 },
        { box: 3, letterSpacing: -0.02, text: 'Family' }
      ],
      status: 'success'
    })
  })

  it('[edge-lines] refuses a file it cannot read, and lines without a box', () => {
    expect(readEdgeLines('nowhere.json')).toEqual({
      error: 'unreadable',
      status: 'failure'
    })
    expect(parseEdgeLines([{ fontSize: 16, text: 'Print' }])).toEqual({
      error: 'malformed',
      status: 'failure'
    })
    expect(parseEdgeLines([])).toEqual({
      error: 'malformed',
      status: 'failure'
    })
  })
})
