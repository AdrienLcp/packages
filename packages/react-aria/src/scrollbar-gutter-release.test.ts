// @vitest-environment happy-dom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ScrollbarGutterRelease } from './scrollbar-gutter-release.ts'

const SCROLLBAR_WIDTH = 15

const mountRelease = async (): Promise<Root> => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(ScrollbarGutterRelease))
  })

  return root
}

const unmount = (root: Root) =>
  act(async () => {
    root.unmount()
  })

beforeAll(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

describe('ScrollbarGutterRelease', () => {
  it('[scrollbar-gutter-release] releases the gutter for overlays open together, and puts it back once the last closes', async () => {
    const { style } = document.documentElement
    const measure = HTMLElement.prototype.getBoundingClientRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const gutter =
          style.getPropertyValue('scrollbar-gutter') === 'auto'
            ? 0
            : SCROLLBAR_WIDTH

        return this.style.position === 'fixed'
          ? new DOMRect(0, 0, window.innerWidth - gutter, window.innerHeight)
          : measure.call(this)
      }
    )

    const leaving = await mountRelease()
    const arriving = await mountRelease()

    expect(style.getPropertyValue('padding-inline-end')).toBe(
      `${SCROLLBAR_WIDTH}px`
    )

    await unmount(leaving)

    expect(style.getPropertyValue('scrollbar-gutter')).toBe('auto')

    await unmount(arriving)

    expect(style.getPropertyValue('scrollbar-gutter')).toBe('')
    expect(style.getPropertyValue('padding-inline-end')).toBe('')
  })
})
