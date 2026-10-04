import type { Tokens } from 'marked'
import { describe, expect, it } from 'vitest'

import { LONGEST_UNBROKEN_CHIP, renderCodeSpan } from './code-span.ts'

const codeSpan = (text: string): Tokens.Codespan => ({
  raw: `\`${text}\``,
  text,
  type: 'codespan'
})

describe('renderCodeSpan', () => {
  it('[code-span] keeps a short chip plain', () => {
    expect(renderCodeSpan(codeSpan('light-dark()'))).toBe(
      '<code>light-dark()</code>'
    )
  })

  it('[code-span] keeps a chip of the longest unbroken length plain', () => {
    const text = 'a'.repeat(LONGEST_UNBROKEN_CHIP)

    expect(renderCodeSpan(codeSpan(text))).toBe(`<code>${text}</code>`)
  })

  it('[code-span] marks a longer chip as long', () => {
    expect(
      renderCodeSpan(codeSpan('findContrastFailures(stylesheet, pairs)'))
    ).toBe(
      '<code class="is-long">findContrastFailures(stylesheet, pairs)</code>'
    )
  })

  it('[code-span] escapes the markup characters of its text', () => {
    expect(renderCodeSpan(codeSpan(`<a href="x">'&'</a>`))).toBe(
      '<code>&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;</code>'
    )
  })
})
