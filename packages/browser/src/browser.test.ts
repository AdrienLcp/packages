import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { copyText } from './copy-text.ts'
import { keepScreenAwake } from './keep-screen-awake.ts'
import {
  prefersReducedMotion,
  REDUCED_MOTION_QUERY,
  subscribeToReducedMotion
} from './prefers-reduced-motion.ts'
import { selectContents } from './select-contents.ts'

const defineOn = (target: object, property: string, value: unknown): void => {
  Object.defineProperty(target, property, { configurable: true, value })
}

const stubClipboard = (writeText: (text: string) => Promise<void>): void => {
  defineOn(navigator, 'clipboard', { writeText })
}

const stubExecCommand = (execCommand: (command: string) => boolean): void => {
  defineOn(document, 'execCommand', execCommand)
}

/** Chrome focuses a textarea it selects; happy-dom does not. */
const focusOnSelect = (): void => {
  const select = HTMLTextAreaElement.prototype.select
  vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(
    function (this: HTMLTextAreaElement) {
      this.focus()
      select.call(this)
    }
  )
}

const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('copyText', () => {
  it('[copy] writes through the Clipboard API when it answers', async () => {
    const writeText = vi.fn(async () => {})
    const execCommand = vi.fn(() => true)
    stubClipboard(writeText)
    stubExecCommand(execCommand)

    expect(await copyText('hello')).toEqual({ status: 'success' })
    expect(writeText).toHaveBeenCalledWith('hello')
    expect(execCommand).not.toHaveBeenCalled()
  })

  it('[copy] falls back to a selection copy when the Clipboard API refuses', async () => {
    let copiedFrom: string | null = null
    stubClipboard(async () => {
      throw new DOMException('denied', 'NotAllowedError')
    })
    stubExecCommand(() => {
      copiedFrom = document.querySelector('textarea')?.value ?? null
      return true
    })

    expect(await copyText('hello')).toEqual({ status: 'success' })
    expect(copiedFrom).toBe('hello')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('[copy] falls back when there is no Clipboard API, as over plain HTTP', async () => {
    defineOn(navigator, 'clipboard', undefined)
    stubExecCommand(() => true)

    expect(await copyText('hello')).toEqual({ status: 'success' })
  })

  it('[copy] is refused when the selection copy fails too', async () => {
    defineOn(navigator, 'clipboard', undefined)
    stubExecCommand(() => false)

    expect(await copyText('hello')).toEqual({
      error: 'refused',
      status: 'failure'
    })
  })

  it('[copy] is refused, and leaves no textarea, when execCommand throws', async () => {
    defineOn(navigator, 'clipboard', undefined)
    stubExecCommand(() => {
      throw new Error('unsupported')
    })

    expect(await copyText('hello')).toEqual({
      error: 'refused',
      status: 'failure'
    })
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('[copy] keeps a focus-trapping dialog open and gives focus back to its button', async () => {
    document.body.innerHTML =
      '<div role="dialog"><button type="button">Copy the code</button></div>'
    const dialog = document.querySelector('[role="dialog"]')
    const copyButton = document.querySelector('button')

    if (dialog === null || copyButton === null) {
      throw new Error('fixture missing')
    }

    let isDialogOpen = true
    document.addEventListener('focusin', (event) => {
      if (!(event.target instanceof Node && dialog.contains(event.target))) {
        isDialogOpen = false
      }
    })
    copyButton.focus()
    focusOnSelect()
    defineOn(navigator, 'clipboard', undefined)
    stubExecCommand(() => true)

    expect(await copyText('ABCD')).toEqual({ status: 'success' })
    expect(isDialogOpen).toBe(true)
    expect(document.activeElement).toBe(copyButton)
    expect(document.querySelector('textarea')).toBeNull()
  })
})

describe('selectContents', () => {
  it('[select] selects the text of the node', () => {
    document.body.innerHTML = '<p>ada@example.com</p>'
    const paragraph = document.querySelector('p')

    if (paragraph === null) {
      throw new Error('fixture missing')
    }

    expect(selectContents(paragraph)).toEqual({ status: 'success' })
    expect(getSelection()?.toString()).toBe('ada@example.com')
  })

  it('[select] is unavailable where the document has no selection', () => {
    vi.stubGlobal('getSelection', () => null)

    expect(selectContents(document.body)).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })
})

type FakeSentinel = { release: () => Promise<void>; released: boolean }

const createFakeWakeLock = () => {
  const sentinels: FakeSentinel[] = []
  const request = vi.fn(async (): Promise<FakeSentinel> => {
    const sentinel: FakeSentinel = {
      release: async () => {
        sentinel.released = true
      },
      released: false
    }
    sentinels.push(sentinel)
    return sentinel
  })

  return { request, sentinels }
}

const setDocumentHidden = (isHidden: boolean): void => {
  defineOn(document, 'hidden', isHidden)
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('keepScreenAwake', () => {
  beforeEach(() => {
    defineOn(document, 'hidden', false)
  })

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock')
  })

  it('[wake-lock] is unsupported where there is no Wake Lock API', () => {
    Reflect.deleteProperty(navigator, 'wakeLock')

    expect(keepScreenAwake()).toEqual({
      error: 'unsupported',
      status: 'failure'
    })
  })

  it('[wake-lock] takes the lock again when the tab comes back', async () => {
    const wakeLock = createFakeWakeLock()
    defineOn(navigator, 'wakeLock', wakeLock)

    const kept = keepScreenAwake()
    await flushPromises()
    expect(kept.status).toBe('success')
    expect(wakeLock.request).toHaveBeenCalledOnce()

    for (const sentinel of wakeLock.sentinels) {
      sentinel.released = true
    }
    setDocumentHidden(true)
    setDocumentHidden(false)
    await flushPromises()

    expect(wakeLock.request).toHaveBeenCalledTimes(2)
  })

  it('[wake-lock] a refused request is retried on return, not thrown', async () => {
    const wakeLock = createFakeWakeLock()
    wakeLock.request.mockRejectedValueOnce(
      new DOMException('low battery', 'NotAllowedError')
    )
    defineOn(navigator, 'wakeLock', wakeLock)

    keepScreenAwake()
    await flushPromises()
    expect(wakeLock.sentinels).toHaveLength(0)

    setDocumentHidden(false)
    await flushPromises()

    expect(wakeLock.sentinels).toHaveLength(1)
  })

  it('[wake-lock] stopping releases the lock and stops listening', async () => {
    const wakeLock = createFakeWakeLock()
    defineOn(navigator, 'wakeLock', wakeLock)

    const kept = keepScreenAwake()
    await flushPromises()

    if (kept.status === 'failure') {
      throw new Error('expected the lock to be supported')
    }

    kept.data()
    await flushPromises()
    setDocumentHidden(false)
    await flushPromises()

    expect(wakeLock.sentinels[0]?.released).toBe(true)
    expect(wakeLock.request).toHaveBeenCalledOnce()
  })
})

describe('prefersReducedMotion', () => {
  const stubMatchMedia = (matches: boolean) => {
    const query = {
      addEventListener: vi.fn(),
      matches,
      removeEventListener: vi.fn()
    }
    const matchMedia = vi.fn(() => query)
    vi.stubGlobal('matchMedia', matchMedia)

    return { matchMedia, query }
  }

  it('[motion] reads the media query', () => {
    const { matchMedia } = stubMatchMedia(true)

    expect(prefersReducedMotion()).toBe(true)
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY)
  })

  it('[motion] is false where there is no matchMedia, as on a server', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(prefersReducedMotion()).toBe(false)
    expect(() => subscribeToReducedMotion(() => {})()).not.toThrow()
  })

  it('[motion] a subscription listens until it is dropped', () => {
    const { query } = stubMatchMedia(false)
    const listener = vi.fn()

    const unsubscribe = subscribeToReducedMotion(listener)
    unsubscribe()

    expect(query.addEventListener).toHaveBeenCalledWith('change', listener)
    expect(query.removeEventListener).toHaveBeenCalledWith('change', listener)
  })
})
