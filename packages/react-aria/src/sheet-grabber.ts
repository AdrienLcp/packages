import type React from 'react'
import { createElement, useEffect, useRef } from 'react'

import {
  moveSheetPull,
  releaseSheetPull,
  type SheetPull,
  startSheetPull
} from './sheet-pull.ts'
import { followSheetTouches } from './sheet-touch-pull.ts'

export type SheetGrabberProps = {
  /** Called once a pull or a flick has gone far enough to put the sheet away. */
  onDismiss: () => void
}

/**
 * The strip across the top of a sheet that a pointer pulls it down by, and
 * what lets a touch pull it from anywhere on its content: downward, from
 * content scrolled to its top, never from a field or a slider. Past a quarter
 * of the sheet's height, or on a flick, it calls `onDismiss`; short of that,
 * the sheet settles back. It must be a direct child of the sheet, since it
 * moves its parent: the sheet follows the thumb through
 * `--sheet-drag-offset`, which the rise of the `sheet` Sass module ends on, so
 * a sheet let go leaves from where it was dropped. Hidden from assistive
 * technology, which closes the sheet with Escape or its own controls.
 */
export const SheetGrabber: React.FC<SheetGrabberProps> = ({ onDismiss }) => {
  const grabberRef = useRef<HTMLDivElement>(null)
  const pullRef = useRef<SheetPull | null>(null)
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    const sheet = grabberRef.current?.parentElement

    if (sheet === null || sheet === undefined) {
      return
    }

    return followSheetTouches(sheet, () => {
      onDismissRef.current()
    })
  }, [])

  const release = (): void => {
    const pull = pullRef.current

    if (pull === null) {
      return
    }

    pullRef.current = null
    releaseSheetPull(pull, onDismiss)
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
      pullRef.current = startSheetPull({
        sheet,
        time: event.timeStamp,
        y: event.clientY
      })
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      const pull = pullRef.current

      if (pull !== null) {
        moveSheetPull(pull, { time: event.timeStamp, y: event.clientY })
      }
    },
    onPointerUp: release,
    ref: grabberRef
  })
}
