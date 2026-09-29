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

const exportTargets = Object.values(manifest.exports).map((target) =>
  typeof target === 'string' ? target : target.sass
)

describe('the package manifest', () => {
  it.each(exportTargets)('points %s at a file that ships', (target) => {
    expect(existsSync(new URL(`../${target}`, import.meta.url))).toBe(true)
  })
})

describe('breakpoints', () => {
  it('splits every width into wide or narrow at 900px', () => {
    const css = compile(`
@use 'breakpoints'
.a
  @include breakpoints.wide
    color: red
  @include breakpoints.narrow
    color: blue
`)
    expect(css).toContain('@media(width >= 900px){.a{color:red}}')
    expect(css).toContain('@media(width < 900px){.a{color:blue}}')
  })

  it('takes another breakpoint through configuration', () => {
    const css = compile(`
@use 'breakpoints' with ($wide-screen: 1024px)
.a
  @include breakpoints.wide
    color: red
`)
    expect(css).toContain('width >= 1024px')
  })
})

describe('focus', () => {
  it('rings both the react-aria and the native focus-visible', () => {
    const css = compile(`
@use 'focus' with ($ring-color: var(--focus), $ring-width: 3px)
.a
  @include focus.ring
`)
    expect(css).toBe(
      '.a[data-focus-visible],.a:focus-visible{outline:3px solid var(--focus);outline-offset:3px}'
    )
  })

  it('draws the inset ring inside the box by its own width', () => {
    const css = compile(`
@use 'focus' with ($ring-width: 3px)
.a
  @include focus.ring-inset
`)
    expect(css).toContain('outline-offset:-3px')
  })

  it('hovers under a fine pointer only, skipping the excepted state', () => {
    const css = compile(`
@use 'focus'
.a
  @include focus.hovered($except: '[data-disabled]')
    color: red
`)
    expect(css).toBe(
      '@media(hover: hover)and (pointer: fine){.a[data-hovered]:not([data-disabled]){color:red}}'
    )
  })
})

describe('fonts', () => {
  it('declares a face and leaves out an axis it was not given', () => {
    const css = compile(`
@use 'fonts'
@include fonts.font-face('Archivo', '/fonts/archivo-latin.woff2', fonts.$latin, $weight: 600 900)
`)
    expect(css).toContain('font-family:"Archivo"')
    expect(css).toContain('font-weight:600 900')
    expect(css).toContain('unicode-range:U+0000-00FF')
    expect(css).not.toContain('font-stretch')
  })
})
