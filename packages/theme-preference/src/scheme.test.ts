import { join } from 'node:path'

import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const PACKAGE_DIRECTORY = join(import.meta.dirname, '..')

const compileDark = () =>
  compileString(`@use 'scheme'\n\n@include scheme.dark\n  --tint: 38%\n`, {
    loadPaths: [PACKAGE_DIRECTORY],
    style: 'compressed',
    syntax: 'indented'
  }).css

describe('scheme', () => {
  it('[scheme] sets a dark value for the system preference unless light is chosen, and for a dark choice', () => {
    expect(compileDark()).toBe(
      '@media(prefers-color-scheme: dark){:root:not([data-theme=light]){--tint: 38%}}:root[data-theme=dark]{--tint: 38%}'
    )
  })
})
