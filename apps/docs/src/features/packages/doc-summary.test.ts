import { describe, expect, it } from 'vitest'

import { firstSentenceOf, sassDocAbove } from './doc-summary.ts'

describe('firstSentenceOf', () => {
  it('[doc-summary] keeps the first sentence of a paragraph', () => {
    expect(firstSentenceOf('Reads a value. Then it does more.')).toBe(
      'Reads a value.'
    )
  })

  it('[doc-summary] joins a sentence written over several lines', () => {
    expect(
      firstSentenceOf('Reads a value\nfrom the\n  manifest. Then more.')
    ).toBe('Reads a value from the manifest.')
  })

  it('[doc-summary] stops at a question mark followed by a space', () => {
    expect(firstSentenceOf('Is it done? Yes.')).toBe('Is it done?')
  })

  it('[doc-summary] does not end a sentence at a full stop inside inline code', () => {
    expect(firstSentenceOf('Reads `a. b` from it. More.')).toBe(
      'Reads `a. b` from it.'
    )
  })

  it('[doc-summary] does not end a sentence at a full stop glued to the next word', () => {
    expect(firstSentenceOf('Reads package.json first. More.')).toBe(
      'Reads package.json first.'
    )
  })

  it('[doc-summary] keeps a paragraph that never ends its sentence whole', () => {
    expect(firstSentenceOf('Reads a value')).toBe('Reads a value')
  })

  it('[doc-summary] reads only the first paragraph', () => {
    expect(firstSentenceOf('Reads a value\n\nSecond paragraph. Third.')).toBe(
      'Reads a value'
    )
  })

  it('[doc-summary] skips the blank lines before the text', () => {
    expect(firstSentenceOf('\n\nText after blanks. More.')).toBe(
      'Text after blanks.'
    )
  })

  it.each([[''], ['  \n ']])(
    '[doc-summary] has no sentence in %j',
    (paragraphs) => {
      expect(firstSentenceOf(paragraphs)).toBeNull()
    }
  )
})

describe('sassDocAbove', () => {
  it('[doc-summary] reads the /// lines right above a line', () => {
    const lines = ['/// Adds a gap.', '/// Twice as wide.', '@mixin gap']

    expect(sassDocAbove(lines, 2)).toBe('Adds a gap.\nTwice as wide.')
  })

  it('[doc-summary] reads only the doc block touching the line', () => {
    const lines = ['/// Old.', '$a: 1', '/// New.', '@mixin gap']

    expect(sassDocAbove(lines, 3)).toBe('New.')
  })

  it('[doc-summary] finds no doc when a blank line separates it from the line', () => {
    const lines = ['/// Adds a gap.', '', '@mixin gap']

    expect(sassDocAbove(lines, 2)).toBeNull()
  })

  it('[doc-summary] finds no doc above the first line', () => {
    expect(sassDocAbove(['@mixin gap'], 0)).toBeNull()
  })
})
