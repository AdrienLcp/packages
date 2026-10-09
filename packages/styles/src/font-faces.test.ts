import { describe, expect, it } from 'vitest'

import { familiesThroughMixins, readFontFaces } from './font-faces.ts'

const unreadKinds = (source: string) =>
  readFontFaces(source).unread.map(({ kind, line }) => ({ kind, line }))

describe('readFontFaces', () => {
  it('[fonts] reads an unquoted family name, and leaves a family no name spells unread', () => {
    const reading = readFontFaces(`@font-face
  font-family: Inter
  src: url('/fonts/inter.woff2')
@font-face
  font-family: var(--font-display)
  src: url('/fonts/display.woff2')`)

    expect(reading.faces).toEqual([{ family: 'Inter', style: 'normal' }])
    expect(reading.unread).toEqual([
      {
        declaration: '@font-face',
        kind: 'unread-family',
        line: 4
      }
    ])
  })

  it('[fonts] ignores an @font-face with no source or no family', () => {
    expect(
      readFontFaces(`@font-face
  font-family: 'Inter'
  font-display: swap
@font-face
  src: url('/fonts/nameless.woff2')
@font-face`)
    ).toEqual({ bands: [], faces: [], mixins: [], unread: [] })
  })

  it('[fonts] lists a mixin face whose family reads no parameter of the mixin', () => {
    expect(
      unreadKinds(`@use '@adrienlcp/styles/fonts'

@mixin display-face()
  @include fonts.font-face($display, '/fonts/display.woff2', fonts.$latin)

@mixin face($file)
  @include fonts.font-face($family, '/fonts/#{$file}.woff2', fonts.$latin)`)
    ).toEqual([
      { kind: 'unread-family', line: 4 },
      { kind: 'unread-family', line: 7 }
    ])
  })

  it('[fonts] lists a face include passed no family, and a fallback include passed no widths', () => {
    expect(
      unreadKinds(`@use '@adrienlcp/styles/fonts'

@include fonts.font-face()
@include fonts.fallback-faces()
@include fonts.fallback-faces('Onest', $metrics)`)
    ).toEqual([
      { kind: 'unread-family', line: 3 },
      { kind: 'unread-family', line: 4 },
      { kind: 'unread-weights', line: 5 }
    ])
  })

  it('[fonts] lists a widths map with a key that is not a literal weight range', () => {
    expect(
      unreadKinds(`@use '@adrienlcp/styles/fonts'

@include fonts.fallback-faces('Onest', $metrics, 0.9, ($regular: 1.02))`)
    ).toEqual([{ kind: 'unread-weights', line: 3 }])
  })

  it('[fonts] registers a mixin that passes its widths parameter through, without an unread entry', () => {
    const reading = readFontFaces(`@use '@adrienlcp/styles/fonts'

@mixin fallback($widths)
  @include fonts.fallback-faces('Onest', $metrics, 0.9, $widths)`)

    expect(reading.bands).toEqual([])
    expect(reading.unread).toEqual([])
  })

  it('[fonts] reads a single weight as a band of one, in the style a variable holds', () => {
    expect(
      readFontFaces(`@use '@adrienlcp/styles/fonts'

$italic: italic

@include fonts.fallback-faces('Onest', $metrics, 0.9, (400: 1.02, 600 700: 1.04), $style: $italic)`)
        .bands
    ).toEqual([
      { family: 'Onest', style: 'italic', weights: [400, 400] },
      { family: 'Onest', style: 'italic', weights: [600, 700] }
    ])
  })

  it('[fonts] takes the normal style when the style is a variable it cannot resolve', () => {
    expect(
      readFontFaces(`@use '@adrienlcp/styles/fonts'

@include fonts.font-face('Onest', '/fonts/onest.woff2', fonts.$latin, $style: $unassigned)`)
        .faces
    ).toEqual([{ family: 'Onest', style: 'normal' }])
  })

  it('[fonts] draws no band from a local face that is not named as a fallback or whose weight is not a range', () => {
    expect(
      readFontFaces(`@font-face { font-family: 'Arial Narrow'; src: local('Arial') }
@font-face { font-family: 'Onest fallback'; font-weight: var(--weight); src: local('Arial') }
@font-face { font-family: 'Onest fallback'; font-style: italic; font-weight: bold; src: local('Arial') }`)
    ).toEqual({
      bands: [{ family: 'Onest', style: 'italic', weights: [700, 700] }],
      faces: [],
      mixins: [],
      unread: []
    })
  })
})

describe('familiesThroughMixins', () => {
  const FACE_MIXIN = { name: 'face', parameter: 'family', position: 0 }

  it('[fonts] skips an include that passes the mixin no family or one it cannot read', () => {
    expect(
      familiesThroughMixins(
        `@use 'faces'

@include faces.face()
@include faces.face($file: 'gochi')
@include faces.face(var(--font-display))
@include faces.face('Onest')`,
        [FACE_MIXIN]
      )
    ).toEqual(['Onest'])
  })
})
