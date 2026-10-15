// @vitest-environment happy-dom

import { act, createElement } from 'react'
import { Button, Dialog, DialogTrigger } from 'react-aria-components'
import { createRoot, type Root } from 'react-dom/client'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { PopoverSheet } from './popover-sheet.ts'
import { SheetGrabber } from './sheet-grabber.ts'

const WIDE_QUERY = '(width >= 56.25rem)'
const PULLED_SHEET_HEIGHT = 400

type Pointer = { clientY: number; timeStamp?: number }

const stubScreen = (isWide: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      addEventListener: () => undefined,
      matches: isWide && query === WIDE_QUERY,
      removeEventListener: () => undefined
    }))
  )
}

let container: HTMLElement
let root: Root

beforeAll(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
})

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

const openMenu = async (): Promise<void> => {
  await act(async () => {
    root.render(
      createElement(
        DialogTrigger,
        null,
        createElement(Button, null, 'Menu'),
        createElement(PopoverSheet, {
          children: createElement(Dialog, { 'aria-label': 'Menu' }, 'Settings'),
          className: 'menu',
          placement: 'bottom end',
          wideQuery: WIDE_QUERY
        })
      )
    )
  })
  await act(async () => {
    container.querySelector('button')?.click()
  })
}

const mountGrabber = async (onDismiss: () => void) => {
  await act(async () => {
    root.render(
      createElement(
        'div',
        { className: 'sheet' },
        createElement(SheetGrabber, { onDismiss })
      )
    )
  })
  const sheet = container.querySelector<HTMLElement>('.sheet')
  const grabber = container.querySelector<HTMLElement>('.sheet-grabber')

  if (sheet === null || grabber === null) {
    throw new Error('The grabber did not render')
  }

  Object.defineProperty(sheet, 'offsetHeight', { value: PULLED_SHEET_HEIGHT })
  grabber.setPointerCapture = () => undefined

  const fire = (type: string, { clientY, timeStamp }: Pointer) =>
    act(async () => {
      const event = new PointerEvent(type, { bubbles: true, clientY })

      if (timeStamp !== undefined) {
        Object.defineProperty(event, 'timeStamp', { value: timeStamp })
      }

      grabber.dispatchEvent(event)
    })

  return { fire, sheet }
}

describe('PopoverSheet', () => {
  it('[popover-sheet] opens a popover beside the trigger on a wide screen', async () => {
    stubScreen(true)

    await openMenu()

    const popover = document.querySelector('.sheet-popover')
    expect(popover?.classList.contains('menu')).toBe(true)
    expect(document.querySelector('.sheet-overlay')).toBeNull()
    expect(document.querySelector('[role="dialog"]')?.textContent).toBe(
      'Settings'
    )
  })

  it('[popover-sheet] opens a sheet over a scrim below the wide screen', async () => {
    stubScreen(false)

    await openMenu()

    const sheet = document.querySelector('.sheet-overlay > .sheet')
    expect(sheet?.classList.contains('menu')).toBe(true)
    expect(sheet?.querySelector(':scope > .sheet-grabber')).not.toBeNull()
    expect(document.querySelector('.sheet-popover')).toBeNull()
    expect(document.querySelector('[role="dialog"]')?.textContent).toBe(
      'Settings'
    )
  })

  it('[popover-sheet] puts the sheet away when Escape is pressed', async () => {
    stubScreen(false)
    await openMenu()

    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })
      )
    })

    expect(document.querySelector('.sheet')).toBeNull()
  })
})

describe('SheetGrabber', () => {
  it('[sheet-grabber] moves the sheet with the thumb', async () => {
    const { fire, sheet } = await mountGrabber(vi.fn())

    await fire('pointerdown', { clientY: 100, timeStamp: 1 })
    await fire('pointermove', { clientY: 160, timeStamp: 1000 })

    expect(sheet.style.getPropertyValue('--sheet-drag-offset')).toBe('60px')
  })

  it('[sheet-grabber] gives a sixth of an upward pull, then holds', async () => {
    const { fire, sheet } = await mountGrabber(vi.fn())

    await fire('pointerdown', { clientY: 100, timeStamp: 1 })
    await fire('pointermove', { clientY: 40, timeStamp: 1000 })

    expect(sheet.style.getPropertyValue('--sheet-drag-offset')).toBe('-10px')
  })

  it('[sheet-grabber] puts the sheet away past a quarter of its height', async () => {
    const onDismiss = vi.fn()
    const { fire } = await mountGrabber(onDismiss)

    await fire('pointerdown', { clientY: 100, timeStamp: 1 })
    await fire('pointermove', { clientY: 210, timeStamp: 1000 })
    await fire('pointerup', { clientY: 210, timeStamp: 1001 })

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('[sheet-grabber] puts the sheet away on a flick, however short', async () => {
    const onDismiss = vi.fn()
    const { fire } = await mountGrabber(onDismiss)

    await fire('pointerdown', { clientY: 100, timeStamp: 1 })
    await fire('pointermove', { clientY: 140, timeStamp: 40 })
    await fire('pointerup', { clientY: 140, timeStamp: 41 })

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('[sheet-grabber] settles a short, slow pull back where it was', async () => {
    const onDismiss = vi.fn()
    const { fire, sheet } = await mountGrabber(onDismiss)

    await fire('pointerdown', { clientY: 100, timeStamp: 1 })
    await fire('pointermove', { clientY: 150, timeStamp: 1000 })
    await fire('pointerup', { clientY: 150, timeStamp: 1001 })

    expect(onDismiss).not.toHaveBeenCalled()
    expect(sheet.style.getPropertyValue('--sheet-drag-offset')).toBe('')
    expect(sheet.dataset.settling).toBe('')

    sheet.dispatchEvent(new Event('transitionend'))

    expect(sheet.dataset.settling).toBeUndefined()
  })

  it('[sheet-grabber] ignores a move or a release with no pull under way', async () => {
    const onDismiss = vi.fn()
    const { fire, sheet } = await mountGrabber(onDismiss)

    await fire('pointermove', { clientY: 300 })
    await fire('pointerup', { clientY: 300 })
    await fire('pointercancel', { clientY: 300 })

    expect(onDismiss).not.toHaveBeenCalled()
    expect(sheet.style.getPropertyValue('--sheet-drag-offset')).toBe('')
  })
})
