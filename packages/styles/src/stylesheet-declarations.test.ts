import { describe, expect, it } from 'vitest'

import { readDeclarations } from './stylesheet-declarations.ts'

describe('readDeclarations', () => {
  it('[declarations] keeps a declaration after a Sass interpolation inside the block that holds it', () => {
    expect(
      readDeclarations(`.card {
  inline-size: calc(#{$columns} * 10rem);
  block-size: 1rem;
}
color: red;`).map(({ block, property }) => ({ block, property }))
    ).toEqual([
      { block: 0, property: 'inline-size' },
      { block: 0, property: 'block-size' },
      { block: -1, property: 'color' }
    ])
  })
})
