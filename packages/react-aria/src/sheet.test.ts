import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

import manifest from '../package.json' with { type: 'json' }
import { SHEET_DRAG_OFFSET } from './sheet-drag-offset.ts'

const SOURCE_DIRECTORY = fileURLToPath(new URL('.', import.meta.url))

const compile = (source: string) =>
  compileString(source, {
    loadPaths: [SOURCE_DIRECTORY],
    style: 'compressed',
    syntax: 'indented'
  }).css

describe('the package manifest', () => {
  it('[manifest] points the sheet export at a file that ships', () => {
    expect(
      existsSync(
        new URL(`../${manifest.exports['./sheet'].sass}`, import.meta.url)
      )
    ).toBe(true)
  })
})

describe('sheet', () => {
  it('[sheet] styles the classes PopoverSheet and SheetGrabber render', () => {
    const css = compile(`
@use 'sheet'
@include sheet.styles
`)

    expect(css).toContain('.sheet-overlay{')
    expect(css).toContain('.sheet{')
    expect(css).toContain('.sheet-grabber{')
    expect(css).toContain('@keyframes sheet-rise')
    expect(css).toContain('@keyframes sheet-scrim')
  })

  it('[sheet] follows the offset the grabber writes, in the rise too', () => {
    const css = compile(`
@use 'sheet'
@include sheet.styles
`)

    expect(css).toContain(`translate:0rem var(${SHEET_DRAG_OFFSET}, 0rem)`)
    expect(css).toContain(`to{translate:0rem var(${SHEET_DRAG_OFFSET}, 0rem)}`)
  })

  it('[sheet] reads the app tokens, with a fallback for each', () => {
    const css = compile(`
@use 'sheet'
.overlay
  @include sheet.overlay
`)

    expect(css).toContain('background:var(--scrim, rgba(0, 0, 0, 0.4))')
    expect(css).toContain(
      '.overlay[data-entering]{animation:sheet-scrim var(--transition-base, 0.2s) var(--ease-out, ease-out)}'
    )
    expect(css).toContain('z-index:10')
  })

  it('[sheet] takes the app look through configuration', () => {
    const css = compile(`
@use 'sheet' with ($z-index: 3, $grabber-radius: var(--radius-control), $top-gap: 2rem)
.overlay
  @include sheet.overlay
.surface
  @include sheet.surface
.grabber
  @include sheet.grabber
`)

    expect(css).toContain('z-index:3')
    expect(css).toContain('border-radius:var(--radius-control)')
    expect(css).toContain('max-block-size:calc(100% - 2rem)')
  })

  it('[sheet] scrolls its content below the grabber, never the rounded sheet', () => {
    const css = compile(`
@use 'sheet'
.surface
  @include sheet.surface
`)

    expect(css).toContain('overflow:clip')
    expect(css).not.toMatch(/\.surface\{[^}]*overflow-y/)
    expect(css).toContain(
      '.surface>:not(.sheet-grabber){min-block-size:0;overflow-y:auto;overscroll-behavior:contain}'
    )
  })

  it('[sheet] settles a short pull back on a transition', () => {
    const css = compile(`
@use 'sheet'
.surface
  @include sheet.surface
`)

    expect(css).toContain(
      '.surface[data-settling]{transition:translate var(--transition-base, 0.2s) var(--ease-out, ease-out)}'
    )
  })
})
