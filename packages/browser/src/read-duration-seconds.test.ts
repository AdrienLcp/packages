import { afterEach, describe, expect, it } from 'vitest'

import { readDurationSeconds } from './read-duration-seconds.ts'

const elementWith = (property: string, value: string): HTMLElement => {
  const element = document.createElement('div')

  element.style.setProperty(property, value)
  document.body.append(element)

  return element
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('readDurationSeconds', () => {
  it.each([
    ['250ms', 0.25],
    ['0.4s', 0.4],
    [' 1.5s ', 1.5],
    ['0s', 0]
  ])('[duration] reads %s as %s seconds', (value, seconds) => {
    expect(readDurationSeconds(elementWith('--turn', value), '--turn')).toBe(
      seconds
    )
  })

  it('[duration] reads an unset or unreadable property as no motion', () => {
    const element = elementWith('--turn', 'auto')

    expect(readDurationSeconds(element, '--turn')).toBe(0)
    expect(readDurationSeconds(element, '--missing')).toBe(0)
  })
})
