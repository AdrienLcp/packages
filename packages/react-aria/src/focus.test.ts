import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

import manifest from '../package.json' with { type: 'json' }

const SOURCE_DIRECTORY = fileURLToPath(new URL('.', import.meta.url))

const compile = (source: string) =>
  compileString(source, {
    loadPaths: [SOURCE_DIRECTORY],
    style: 'compressed',
    syntax: 'indented'
  }).css

describe('the package manifest', () => {
  it('[manifest] points the focus export at a file that ships', () => {
    expect(
      existsSync(
        new URL(`../${manifest.exports['./focus'].sass}`, import.meta.url)
      )
    ).toBe(true)
  })
})

describe('focus', () => {
  it('[focus] rings both the react-aria and the native focus-visible', () => {
    const css = compile(`
@use 'focus' with ($ring-color: var(--focus), $ring-width: 3px)
.a
  @include focus.ring
`)
    expect(css).toBe(
      '.a[data-focus-visible],.a:focus-visible{outline:3px solid var(--focus);outline-offset:3px}'
    )
  })

  it('[focus] draws the inset ring inside the box by its own width', () => {
    const css = compile(`
@use 'focus' with ($ring-width: 3px)
.a
  @include focus.ring-inset
`)
    expect(css).toContain('outline-offset:-3px')
  })

  it('[focus] takes another offset through configuration', () => {
    const css = compile(`
@use 'focus' with ($ring-offset: 1px)
.a
  @include focus.ring
`)
    expect(css).toContain('outline-offset:1px')
  })

  it('[focus] rings a descendant of the focused element', () => {
    const css = compile(`
@use 'focus'
.switch
  @include focus.ring-inset('.track')
`)
    expect(css).toBe(
      '.switch[data-focus-visible] .track,.switch:focus-visible .track{outline:2px solid currentColor;outline-offset:-2px}'
    )
  })

  it('[focus] rings a box while a field inside it has focus', () => {
    const css = compile(`
@use 'focus'
.search-box
  @include focus.ring-within
`)
    expect(css).toBe(
      '.search-box:has([data-focus-visible],:focus-visible){outline:2px solid currentColor;outline-offset:3px}'
    )
  })
})
