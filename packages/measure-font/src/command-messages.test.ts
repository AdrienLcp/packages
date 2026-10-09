import { describe, expect, it } from 'vitest'

import {
  measureFailureMessage,
  textSourceFailureMessage
} from './command-messages.ts'

describe('measureFailureMessage', () => {
  it.each([
    [{ reason: 'no-face' } as const, 'No font file to measure.'],
    [
      { face: 'Onest 400', reason: 'no-glyph', text: 'figures' } as const,
      'Onest 400: no glyph for the digits. List the subset that draws them with it.'
    ],
    [
      {
        faces: ['onest-400.woff2', 'onest-variable.woff2'],
        reason: 'duplicate-weight',
        weight: 400
      } as const,
      'Two faces measure at 400: onest-400.woff2, onest-variable.woff2. Measure one family in one style per run.'
    ],
    [
      { reason: 'unmeasured-line-weight', weight: 650 } as const,
      'A line is set at 650, a weight not measured: add --weight 650.'
    ]
  ])('[measure-font] explains a %o failure', (failure, message) => {
    expect(measureFailureMessage(failure)).toBe(message)
  })
})

describe('textSourceFailureMessage', () => {
  it.each([
    [
      { path: 'en.yaml', reason: 'unsupported-dictionary' } as const,
      'en.yaml: a dictionary is a .json, .ts or .js file'
    ],
    [
      { path: 'en.json', reason: 'unreadable-dictionary' } as const,
      'en.json: not a dictionary Node can read'
    ],
    [
      { path: 'dist', reason: 'no-html' } as const,
      'dist: no .html page under it'
    ],
    [
      { reason: 'bad-selector', select: 'h1[' } as const,
      '--select h1[: not a selector'
    ]
  ])('[measure-font] explains a %o text source failure', (failure, message) => {
    expect(textSourceFailureMessage(failure)).toBe(message)
  })
})
