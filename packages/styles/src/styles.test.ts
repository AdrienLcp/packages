import { existsSync, readFileSync } from 'node:fs'
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

describe('reset', () => {
  it('lets every size transition reach an intrinsic keyword', () => {
    const reset = readFileSync(new URL('reset.css', import.meta.url), 'utf8')
    expect(reset).toMatch(/html \{[^}]*interpolate-size: allow-keywords;/)
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

describe('containers', () => {
  it('declares an inline-size container, named only when given a name', () => {
    const css = compile(`
@use 'containers'
.anonymous
  @include containers.container
.named
  @include containers.container(card)
`)
    expect(css).toContain('.anonymous{container-type:inline-size}')
    expect(css).toContain(
      '.named{container-type:inline-size;container-name:card}'
    )
  })

  it('splits every container width into wide or narrow at the given width', () => {
    const css = compile(`
@use 'containers'
.a
  @include containers.container-wide(30rem)
    color: red
  @include containers.container-narrow(30rem)
    color: blue
`)
    expect(css).toContain('@container (width >= 30rem){.a{color:red}}')
    expect(css).toContain('@container (width < 30rem){.a{color:blue}}')
  })

  it('queries a named container', () => {
    const css = compile(`
@use 'containers'
.a
  @include containers.container-wide(30rem, card)
    color: red
`)
    expect(css).toContain('@container card (width >= 30rem){.a{color:red}}')
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
