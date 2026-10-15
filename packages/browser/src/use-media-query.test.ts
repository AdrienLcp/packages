import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useMediaQuery } from './use-media-query.ts'

const WIDE_QUERY = '(width >= 56.25rem)'

type FakeMedia = {
  addEventListener: (type: 'change', listener: () => void) => void
  listeners: Set<() => void>
  matches: boolean
  removeEventListener: (type: 'change', listener: () => void) => void
}

const stubMatchMedia = (matches: boolean): FakeMedia => {
  const listeners = new Set<() => void>()
  const media: FakeMedia = {
    addEventListener: (_, listener) => listeners.add(listener),
    listeners,
    matches,
    removeEventListener: (_, listener) => listeners.delete(listener)
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media)
  )

  return media
}

const Width = ({ query }: { query: string }) =>
  useMediaQuery(query) ? 'wide' : 'narrow'

describe('useMediaQuery', () => {
  let container: HTMLElement
  let root: Root

  const render = (query: string): Promise<void> =>
    act(async () => {
      root.render(createElement(Width, { query }))
    })

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    container = document.createElement('div')
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    vi.unstubAllGlobals()
  })

  it('[media-query] answers whether the screen matches now', async () => {
    stubMatchMedia(true)

    await render(WIDE_QUERY)

    expect(container.textContent).toBe('wide')
    expect(matchMedia).toHaveBeenCalledWith(WIDE_QUERY)
  })

  it('[media-query] follows the screen when it stops matching', async () => {
    const media = stubMatchMedia(true)
    await render(WIDE_QUERY)

    media.matches = false
    await act(async () => {
      for (const listener of media.listeners) listener()
    })

    expect(container.textContent).toBe('narrow')
  })

  it('[media-query] stops listening once unmounted', async () => {
    const media = stubMatchMedia(false)
    await render(WIDE_QUERY)

    await act(async () => {
      root.unmount()
    })
    root = createRoot(container)

    expect(media.listeners.size).toBe(0)
  })

  it('[media-query] is false on the server', () => {
    expect(renderToString(createElement(Width, { query: WIDE_QUERY }))).toBe(
      'narrow'
    )
  })
})
