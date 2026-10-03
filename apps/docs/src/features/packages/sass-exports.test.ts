import { describe, expect, it } from 'vitest'

import { sassExportsOf } from './sass-exports.ts'

describe('sassExportsOf', () => {
  it('[sass-exports] lists mixins, functions and variables under the name a consumer writes', () => {
    const source = [
      '@mixin gap($size) {',
      '}',
      '@function rem($px) {',
      '}',
      '$gutter: 1rem'
    ].join('\n')

    expect(sassExportsOf(source)).toEqual([
      { kind: 'sass', name: 'gap', summary: null },
      { kind: 'sass', name: 'rem()', summary: null },
      { kind: 'sass', name: '$gutter', summary: null }
    ])
  })

  it('[sass-exports] takes the first sentence of the /// doc as the summary', () => {
    const source = [
      '/// Spaces things out. Twice.',
      '/// Details.',
      '@mixin gap {',
      '}'
    ].join('\n')

    expect(sassExportsOf(source)).toEqual([
      { kind: 'sass', name: 'gap', summary: 'Spaces things out.' }
    ])
  })

  it('[sass-exports] skips the private members Sass hides', () => {
    const source = [
      '@mixin _hidden {',
      '}',
      '@function -internal() {',
      '}',
      '$_secret: 1',
      '$-other: 2',
      '$shown: 3'
    ].join('\n')

    expect(sassExportsOf(source).map(({ name }) => name)).toEqual(['$shown'])
  })

  it('[sass-exports] skips what is declared inside a block', () => {
    const source = '@mixin gap {\n  $local: 1\n}'

    expect(sassExportsOf(source).map(({ name }) => name)).toEqual(['gap'])
  })

  it('[sass-exports] reads a file saved with Windows line endings', () => {
    expect(
      sassExportsOf('/// Gap.\r\n@mixin gap {\r\n}\r\n').map(
        ({ name, summary }) => [name, summary]
      )
    ).toEqual([['gap', 'Gap.']])
  })
})
