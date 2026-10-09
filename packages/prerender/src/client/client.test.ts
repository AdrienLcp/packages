import { afterEach, describe, expect, it, vi } from 'vitest'

import { parseDocument } from '../html-document.ts'
import { capturePrerenderedText, textNodesOf } from './prerendered-text.ts'
import { startAppAfterFirstPaint } from './start-app-after-first-paint.ts'

const rootOf = (html: string): Element => {
  const root = parseDocument(
    `<!DOCTYPE html><html><body><div id="root">${html}</div></body></html>`
  ).querySelector('#root')

  if (root === null) {
    throw new Error('the fixture has no root')
  }

  return root
}

describe('prerendered text', () => {
  it('reads the text nodes in order, past the separator a server render writes', () => {
    expect(
      textNodesOf(rootOf('<p>Hello <!-- -->Ada</p><p><b>2</b> votes</p>'))
    ).toEqual(['Hello ', 'Ada', '2', ' votes'])
  })

  it('finds nothing when the first render writes the same text nodes', () => {
    const root = rootOf('<p>Hello <!-- -->Ada</p>')
    const prerendered = capturePrerenderedText(root)

    root.innerHTML = '<p></p>'
    root
      .querySelector('p')
      ?.append(
        root.ownerDocument.createTextNode('Hello '),
        root.ownerDocument.createTextNode('Ada')
      )

    expect(prerendered.findMismatch()).toBeNull()
  })

  it('names the first text node the first render changed', () => {
    const root = rootOf('<p>9 October</p><p>Ada</p>')
    const prerendered = capturePrerenderedText(root)

    root.innerHTML = '<p>10 October</p><p>Ada</p>'

    expect(prerendered.findMismatch()).toEqual({
      index: 0,
      prerendered: '9 October',
      rendered: '10 October'
    })
  })

  it('names a text node only one side has', () => {
    const root = rootOf('<p>Ada</p>')
    const prerendered = capturePrerenderedText(root)

    root.innerHTML = '<p>Ada</p><p>Light</p>'

    expect(prerendered.findMismatch()).toEqual({
      index: 1,
      prerendered: null,
      rendered: 'Light'
    })
  })

  it('[prerender] names a text node the first render dropped', () => {
    const root = rootOf('<p>Ada</p><p>Light</p>')
    const prerendered = capturePrerenderedText(root)

    root.innerHTML = '<p>Ada</p>'

    expect(prerendered.findMismatch()).toEqual({
      index: 1,
      prerendered: 'Light',
      rendered: null
    })
  })

  it('[prerender] leaves out an empty text node a client render keeps', () => {
    const root = rootOf('<p>Ada</p>')
    root.querySelector('p')?.append(root.ownerDocument.createTextNode(''))

    expect(textNodesOf(root)).toEqual(['Ada'])
  })
})

type Visibility = 'hidden' | 'visible'

const stubPage = (visibilityState: Visibility) => {
  const listeners = new Set<() => void>()
  const frames: Array<() => void> = []
  const page = {
    addEventListener: (_: string, listener: () => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_: string, listener: () => void) => {
      listeners.delete(listener)
    },
    visibilityState
  }

  vi.stubGlobal('document', page)
  vi.stubGlobal('requestAnimationFrame', (frame: () => void) => {
    frames.push(frame)
  })

  const changeVisibility = (state: Visibility) => {
    page.visibilityState = state
    for (const listener of listeners) {
      listener()
    }
  }

  return {
    hide: () => changeVisibility('hidden'),
    paint: () => {
      for (const frame of frames.splice(0)) {
        frame()
      }
    },
    show: () => changeVisibility('visible')
  }
}

describe('startAppAfterFirstPaint', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('starts the app in the task after the next frame', () => {
    vi.useFakeTimers()
    const page = stubPage('visible')
    const start = vi.fn()

    startAppAfterFirstPaint(start)
    expect(start).not.toHaveBeenCalled()

    page.paint()
    expect(start).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(start).toHaveBeenCalledOnce()
  })

  it('starts at once in a hidden tab, which runs no frame', () => {
    stubPage('hidden')
    const start = vi.fn()

    startAppAfterFirstPaint(start)

    expect(start).toHaveBeenCalledOnce()
  })

  it('starts once when the tab is hidden before the frame comes', () => {
    vi.useFakeTimers()
    const page = stubPage('visible')
    const start = vi.fn()

    startAppAfterFirstPaint(start)
    page.hide()
    page.paint()
    vi.runAllTimers()

    expect(start).toHaveBeenCalledOnce()
  })

  it('[prerender] waits for the frame when the tab turns visible again', () => {
    vi.useFakeTimers()
    const page = stubPage('visible')
    const start = vi.fn()

    startAppAfterFirstPaint(start)
    page.show()
    expect(start).not.toHaveBeenCalled()

    page.paint()
    vi.runAllTimers()
    expect(start).toHaveBeenCalledOnce()
  })
})
