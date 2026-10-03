import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Animate, type AnimateProps } from './animate.ts'
import { staggerStyle } from './stagger-style.ts'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

let container: HTMLElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const render = async (props: AnimateProps<'section'>) => {
  await act(async () => {
    root.render(createElement(Animate<'section'>, props))
  })
}

const section = () => container.querySelector('section')

describe('Animate', () => {
  it('[animate] renders the element it is given while visible', async () => {
    await render({ as: 'section', className: 'toast', isVisible: true })

    expect(section()?.className).toBe('toast')
    expect(section()?.hidden).toBe(false)
  })

  it('[animate] renders nothing while hidden', async () => {
    await render({ as: 'section', isVisible: false })

    expect(container.innerHTML).toBe('')
  })

  it('[animate] leaves at once when nothing in it moves', async () => {
    const onExited = vi.fn()
    await render({ as: 'section', isVisible: true, onExited })
    await render({ as: 'section', isVisible: false, onExited })

    expect(section()).toBeNull()
    expect(onExited).toHaveBeenCalledOnce()
  })

  it('[animate] stays marked as exiting until its animation ends', async () => {
    const onExited = vi.fn()
    await render({ as: 'section', isVisible: true, onExited })
    const animation = section()?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 50
    })
    await render({ as: 'section', isVisible: false, onExited })

    expect(section()?.hasAttribute('data-exiting')).toBe(true)
    expect(onExited).not.toHaveBeenCalled()

    await act(async () => {
      await animation?.finished
    })

    expect(section()).toBeNull()
    expect(onExited).toHaveBeenCalledOnce()
  })

  it('[animate] coming back mid-exit cancels the exit', async () => {
    const onExited = vi.fn()
    await render({ as: 'section', isVisible: true, onExited })
    const animation = section()?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 50
    })
    await render({ as: 'section', isVisible: false, onExited })
    await render({ as: 'section', isVisible: true, onExited })
    await act(async () => {
      await animation?.finished
    })

    expect(section()?.hasAttribute('data-exiting')).toBe(false)
    expect(onExited).not.toHaveBeenCalled()
  })

  it('[animate] keepMounted hides the element instead of removing it', async () => {
    await render({ as: 'section', isVisible: false, keepMounted: true })
    expect(section()?.hidden).toBe(true)

    await render({ as: 'section', isVisible: true, keepMounted: true })
    expect(section()?.hidden).toBe(false)

    await render({ as: 'section', isVisible: false, keepMounted: true })
    expect(section()?.hidden).toBe(true)
  })
})

describe('staggerStyle', () => {
  it('[stagger] hands the item its index and the list its length', () => {
    expect(staggerStyle(2, 5)).toEqual({
      '--stagger-count': 5,
      '--stagger-index': 2
    })
  })
})
