import { fileURLToPath } from 'node:url'

import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

import { sassValues } from './sass-values.ts'

const SCREEN_SIZES = { shortScreen: '30rem', wideScreen: '40rem' } as const

const compileWith = ({
  importer,
  source
}: {
  importer: ReturnType<typeof sassValues>
  source: string
}) =>
  compileString(source, {
    importers: [importer],
    style: 'compressed',
    syntax: 'indented'
  }).css

describe('sassValues', () => {
  it('[sass-values] serves a module of values under its scheme, named in kebab case', () => {
    const css = compileWith({
      importer: sassValues({ 'screen-sizes': SCREEN_SIZES }),
      source: `
@use 'values:screen-sizes'
.a
  @media (width >= screen-sizes.$wide-screen) and (height >= screen-sizes.$short-screen)
    color: red
`
    })

    expect(css).toBe(
      '@media(width >= 40rem)and (height >= 30rem){.a{color:red}}'
    )
  })

  it('[sass-values] configures a module of the package from the same values', () => {
    const css = compileString(
      `
@use 'values:screen-sizes'
@use 'breakpoints' with ($wide-screen: screen-sizes.$wide-screen)
.a
  @include breakpoints.wide
    color: red
`,
      {
        importers: [sassValues({ 'screen-sizes': SCREEN_SIZES })],
        loadPaths: [fileURLToPath(new URL('.', import.meta.url))],
        style: 'compressed',
        syntax: 'indented'
      }
    ).css

    expect(css).toBe('@media(width >= 40rem){.a{color:red}}')
  })

  it('[sass-values] writes a number as a number, under another scheme', () => {
    const css = compileWith({
      importer: sassValues({ grid: { columns: 12 } }, { scheme: 'app' }),
      source: `
@use 'sass:math'
@use 'app:grid'
.a
  width: math.div(100%, grid.$columns)
`
    })

    expect(css).toBe('.a{width:8.3333333333%}')
  })

  it('[sass-values] names the modules it serves when asked for another', () => {
    expect(() =>
      compileWith({
        importer: sassValues({ 'screen-sizes': SCREEN_SIZES }),
        source: "@use 'values:sizes'"
      })
    ).toThrow('it serves values:screen-sizes')
  })

  it.each([
    ['a name Sass cannot take', { 'wide screen': '1rem' }, 'not a camelCase'],
    [
      'a value that would end its declaration',
      { wide: '1rem; x: 2' },
      'not one CSS value'
    ]
  ])('[sass-values] refuses %s', (_, values, message) => {
    expect(() => sassValues({ sizes: values })).toThrow(message)
  })

  it('[sass-values] refuses a module name that is not kebab case', () => {
    expect(() => sassValues({ screenSizes: SCREEN_SIZES })).toThrow(
      'screenSizes is not a kebab-case module name'
    )
  })

  it('[sass-values] loads nothing for a canonical url it does not serve', () => {
    expect(
      sassValues({ 'screen-sizes': SCREEN_SIZES }).load(new URL('values:sizes'))
    ).toBeNull()
  })
})
