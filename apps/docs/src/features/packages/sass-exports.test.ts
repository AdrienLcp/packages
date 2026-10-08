import { describe, expect, it } from 'vitest'

import { sassExportsOf } from './sass-exports.ts'

const indented = (...lines: string[]) =>
  sassExportsOf({ path: 'src/_module.sass', source: lines.join('\n') })

describe('sassExportsOf', () => {
  it('[sass-exports] lists mixins, functions and variables under the name a consumer writes', () => {
    expect(
      indented(
        '@mixin gap($size)',
        '  margin: $size',
        '@function double($size)',
        '  @return $size * 2',
        '$gutter: 1rem'
      )
    ).toEqual([
      { kind: 'sass', name: 'gap', summary: null },
      { kind: 'sass', name: 'double()', summary: null },
      { kind: 'sass', name: '$gutter', summary: null }
    ])
  })

  it('[sass-exports] reads the SCSS syntax from a .scss file', () => {
    const source = '@mixin gap($size) {\n  margin: $size;\n}\n$gutter: 1rem;'

    expect(
      sassExportsOf({ path: 'src/_module.scss', source }).map(
        ({ name }) => name
      )
    ).toEqual(['gap', '$gutter'])
  })

  it('[sass-exports] takes the first sentence of the /// doc as the summary', () => {
    expect(
      indented(
        '/// Spaces things out. Twice.',
        '/// Details.',
        '@mixin gap',
        '  margin: 1rem'
      )
    ).toEqual([{ kind: 'sass', name: 'gap', summary: 'Spaces things out.' }])
  })

  it('[sass-exports] takes neither a plain comment nor a detached doc as the summary', () => {
    expect(
      indented('// Not a doc.', '$a: 1', '/// Detached.', '', '$b: 2').map(
        ({ summary }) => summary
      )
    ).toEqual([null, null])
  })

  it('[sass-exports] skips the private members Sass hides', () => {
    expect(
      indented(
        '@mixin _hidden',
        '  margin: 0',
        '@function -internal()',
        '  @return 0',
        '$_secret: 1',
        '$-other: 2',
        '$shown: 3'
      ).map(({ name }) => name)
    ).toEqual(['$shown'])
  })

  it('[sass-exports] skips what is declared inside a block', () => {
    expect(
      indented('@mixin gap', '  $local: 1', '  margin: $local').map(
        ({ name }) => name
      )
    ).toEqual(['gap'])
  })

  it('[sass-exports] reads a file saved with Windows line endings', () => {
    expect(
      sassExportsOf({
        path: 'src/_module.sass',
        source: '/// Gap.\r\n@mixin gap\r\n  margin: 0\r\n'
      }).map(({ name, summary }) => [name, summary])
    ).toEqual([['gap', 'Gap.']])
  })
})
