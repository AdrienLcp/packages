import type React from 'react'
import { createElement, useRef } from 'react'

import { SHEET_DRAG_OFFSET } from './sheet-drag-offset.ts'

/** A pull past this share of the sheet's height puts it away. */
const DISMISS_SHARE = 0.25
/** A flick faster than this, in pixels per millisecond, puts it away whatever the distance. */
const DISMISS_VELOCITY = 0.6
/** How far an upward pull moves the sheet for each pixel the thumb goes: it gives, then holds. */
const UPWARD_GIVE = 1 / 6

type Pull = {
  lastTime: number
  lastY: number
  sheet: HTMLElement
  startY: number
  velocity: number
}

export type SheetGrabberProps = {
  /** Called once a pull or a flick has gone far enough to put the sheet away. */
  onDismiss: () => void
}

/**
 * The strip across the top of a sheet that a thumb pulls it down by: past a
 * quarter of the sheet's height, or on a flick, it calls `onDismiss`; short of
 * that, the sheet settles back. It must be a direct child of the sheet, since it
 * moves its parent: the sheet follows the thumb through `--sheet-drag-offset`,
 * which the rise of the `sheet` Sass module ends on, so a sheet let go leaves
 * from where it was dropped. Hidden from assistive technology, which closes
 * the sheet with Escape or its own controls.
 */
export const SheetGrabber: React.FC<SheetGrabberProps> = ({ onDismiss }) => {
  const pullRef = useRef<Pull | null>(null)

  const release = (): void => {
    const pull = pullRef.current

    if (pull === null) {
      return
    }

    pullRef.current = null

    const offset = pull.lastY - pull.startY
    const isDismissed =
      offset > pull.sheet.offsetHeight * DISMISS_SHARE ||
      pull.velocity > DISMISS_VELOCITY

    if (isDismissed) {
      onDismiss()

      return
    }

    pull.sheet.dataset.settling = ''
    pull.sheet.style.removeProperty(SHEET_DRAG_OFFSET)
    pull.sheet.addEventListener(
      'transitionend',
      () => {
        delete pull.sheet.dataset.settling
      },
      { once: true }
    )
  }

  return createElement('div', {
    'aria-hidden': true,
    className: 'sheet-grabber',
    onPointerCancel: release,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      const sheet = event.currentTarget.parentElement

      if (sheet === null) {
        return
      }

      event.currentTarget.setPointerCapture(event.pointerId)
      delete sheet.dataset.settling
      pullRef.current = {
        lastTime: event.timeStamp,
        lastY: event.clientY,
        sheet,
        startY: event.clientY,
        velocity: 0
      }
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      const pull = pullRef.current

      if (pull === null) {
        return
      }

      const elapsed = Math.max(1, event.timeStamp - pull.lastTime)
      pull.velocity = (event.clientY - pull.lastY) / elapsed
      pull.lastY = event.clientY
      pull.lastTime = event.timeStamp

      const offset = event.clientY - pull.startY
      pull.sheet.style.setProperty(
        SHEET_DRAG_OFFSET,
        `${offset > 0 ? offset : offset * UPWARD_GIVE}px`
      )
    },
    onPointerUp: release
  })
}
