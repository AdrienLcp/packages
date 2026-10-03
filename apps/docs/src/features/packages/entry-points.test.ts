import { describe, expect, it } from 'vitest'

import { entryPointsOf } from './entry-points.ts'

const entryPointsOfExports = (exports: unknown) =>
  entryPointsOf({ exports, scopedName: '@adrienlcp/styles' })

describe('entryPointsOf', () => {
  it('[entry-points] reads a compiled file from the source it was built from', () => {
    expect(
      entryPointsOfExports({
        '.': { import: './dist/index.js', types: './dist/index.d.ts' }
      })
    ).toEqual([
      {
        format: 'module',
        path: 'src/index.js',
        specifier: '@adrienlcp/styles'
      }
    ])
  })

  it('[entry-points] names a subpath the way a consumer imports it', () => {
    expect(
      entryPointsOfExports({ './react': './dist/react.js' }).map(
        ({ specifier }) => specifier
      )
    ).toEqual(['@adrienlcp/styles/react'])
  })

  it('[entry-points] tells Sass, module and plain files apart', () => {
    expect(
      entryPointsOfExports(
        Object.fromEntries([
          ['./fonts', './src/_fonts.sass'],
          ['./tokens', './src/tokens.scss'],
          ['./react', './dist/react.js'],
          ['./biome.json', './biome.json']
        ])
      ).map(({ format, path }) => [format, path])
    ).toEqual([
      ['sass', 'src/_fonts.sass'],
      ['sass', 'src/tokens.scss'],
      ['module', 'src/react.js'],
      ['file', 'biome.json']
    ])
  })

  it('[entry-points] prefers the sass condition, then import, then default', () => {
    expect(
      entryPointsOfExports({
        './a': {
          default: './src/default.css',
          import: './dist/a.js',
          sass: './src/_a.sass'
        },
        './b': { default: './src/default.css', import: './dist/b.js' },
        './c': { default: './src/c.css' }
      }).map(({ path }) => path)
    ).toEqual(['src/_a.sass', 'src/b.js', 'src/c.css'])
  })

  it('[entry-points] skips the manifest itself and entries with no usable target', () => {
    expect(
      entryPointsOfExports({
        './broken': 3,
        './kept': './dist/kept.js',
        './package.json': './package.json',
        './typed': { types: './dist/typed.d.ts' }
      }).map(({ specifier }) => specifier)
    ).toEqual(['@adrienlcp/styles/kept'])
  })

  it('[entry-points] keeps the order of the manifest', () => {
    expect(
      entryPointsOfExports(
        Object.fromEntries([
          ['./b', './dist/b.js'],
          ['.', './dist/index.js'],
          ['./a', './dist/a.js']
        ])
      ).map(({ specifier }) => specifier)
    ).toEqual([
      '@adrienlcp/styles/b',
      '@adrienlcp/styles',
      '@adrienlcp/styles/a'
    ])
  })

  it.each([[undefined], [null], ['./dist/index.js'], [['./dist/index.js']]])(
    '[entry-points] has no entry point when exports is %j',
    (exports) => {
      expect(entryPointsOfExports(exports)).toEqual([])
    }
  )
})
