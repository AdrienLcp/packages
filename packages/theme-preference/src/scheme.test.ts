import { join } from 'node:path'

import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const PACKAGE_DIRECTORY = join(import.meta.dirname, '..')

const compile = (mixin: 'dark' | 'light') =>
  compileString(`@use 'scheme'\n\n@include scheme.${mixin}\n  --tint: 38%\n`, {
    loadPaths: [PACKAGE_DIRECTORY],
    style: 'compressed',
    syntax: 'indented'
  }).css

describe('scheme', () => {
  it('[scheme] sets a dark value for the system preference unless light is chosen, and for a dark choice', () => {
    expect(compile('dark')).toBe(
      '@media(prefers-color-scheme: dark){:root:not([data-theme=light]){--tint: 38%}}:root[data-theme=dark]{--tint: 38%}'
    )
  })

  it('[scheme] mirrors it for a light value', () => {
    expect(compile('light')).toBe(
      '@media(prefers-color-scheme: light){:root:not([data-theme=dark]){--tint: 38%}}:root[data-theme=light]{--tint: 38%}'
    )
  })
})
