import { describe, expect, it } from 'vitest'

import { composeClassName } from './compose-class-name.ts'

describe('composeClassName', () => {
  const renderState = { defaultClassName: undefined, isPressed: true }

  it('[class-name] puts its own class names before a string className', () => {
    expect(composeClassName('primary', 'button')(renderState)).toBe(
      'button primary'
    )
  })

  it('[class-name] resolves a className function against the render state', () => {
    const incoming = ({ isPressed }: { isPressed: boolean }) =>
      isPressed ? 'pressed' : 'idle'

    expect(composeClassName(incoming, 'button')(renderState)).toBe(
      'button pressed'
    )
  })

  it('[class-name] drops the class names that are falsy', () => {
    expect(
      composeClassName<{ isPressed: boolean }>(
        undefined,
        'button',
        false,
        null,
        undefined
      )(renderState)
    ).toBe('button')
  })
})
