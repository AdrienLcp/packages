import { describe, expect, expectTypeOf, it } from 'vitest'

import { classNames, type PlainClassName } from './class-names.ts'

describe('classNames', () => {
  it('[class-name] joins class names with a space, in order', () => {
    expect(classNames('icon', 'site-link-icon')).toBe('icon site-link-icon')
  })

  it('[class-name] drops the class names that are falsy', () => {
    expect(classNames('icon', undefined, false, null, '')).toBe('icon')
  })

  it('[class-name] answers an empty string when no class name is left', () => {
    expect(classNames(undefined, false)).toBe('')
  })

  it('[types] refuses a className function', () => {
    const renderStateClassName = ({ isPressed }: { isPressed: boolean }) =>
      isPressed ? 'pressed' : 'idle'

    expectTypeOf(renderStateClassName).not.toExtend<PlainClassName>()
  })
})
