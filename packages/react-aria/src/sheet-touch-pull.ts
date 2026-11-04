import {
  moveSheetPull,
  releaseSheetPull,
  type SheetPull,
  startSheetPull
} from './sheet-pull.ts'

/**
 * How far a touch travels before its direction is read, in pixels: under the
 * browsers' own slop, so a pull is claimed before a scroll could begin.
 */
const DIRECTION_DISTANCE = 6

/** What a thumb drags for its own sake: a caret, a selection, a thumb on a track. */
const DRAGGED_CONTROL_SELECTOR =
  'input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="slider"]'

type TouchGesture =
  | { phase: 'ignored' }
  | { phase: 'pulling'; pull: SheetPull; touchId: number }
  | {
      canPull: boolean
      phase: 'undecided'
      pointerId: number
      startTime: number
      startX: number
      startY: number
      target: EventTarget
      touchId: number
    }

/** Whether the element lets the browser pan it downward, which is what a pull takes over. */
const allowsDownwardPan = (element: Element): boolean => {
  const { touchAction } = getComputedStyle(element)

  return (
    touchAction === '' ||
    touchAction === 'auto' ||
    touchAction === 'manipulation' ||
    touchAction.includes('pan-y') ||
    touchAction.includes('pan-down')
  )
}

/**
 * A touch pulls the sheet only from content at the top of its scroll, never
 * from a control the thumb drags or from anything that handles its own touches.
 */
const canPullFrom = (
  target: EventTarget | null,
  sheet: HTMLElement
): boolean => {
  if (
    !(target instanceof Element) ||
    target.closest(DRAGGED_CONTROL_SELECTOR)
  ) {
    return false
  }

  for (
    let element: Element | null = target;
    element !== null && element !== sheet;
    element = element.parentElement
  ) {
    if (element.scrollTop > 0 || !allowsDownwardPan(element)) {
      return false
    }
  }

  return true
}

const findTouch = (touches: TouchList, touchId: number): Touch | undefined =>
  Array.from(touches).find(({ identifier }) => identifier === touchId)

/**
 * The press under the thumb is not one once the sheet moves: the control
 * travels with the thumb and would still be under it on release, and
 * react-aria completes a touch press with a click of its own when the browser
 * sends none.
 */
const cancelPress = (target: EventTarget, pointerId: number): void => {
  target.dispatchEvent(
    new PointerEvent('pointercancel', {
      bubbles: true,
      pointerId,
      pointerType: 'touch'
    })
  )
}

/**
 * Lets a touch anywhere on the sheet pull it down, as a native sheet does:
 * downward, from content scrolled to its top. A touch going up or sideways, or
 * starting on scrolled content, a field or a slider, is left to the browser.
 * Returns what removes the listeners.
 */
export const followSheetTouches = (
  sheet: HTMLElement,
  onDismiss: () => void
): (() => void) => {
  let gesture: TouchGesture | null = null
  let touchPointerId = 0

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      touchPointerId = event.pointerId
    }
  }

  const onTouchStart = (event: TouchEvent): void => {
    if (gesture?.phase === 'pulling') {
      return
    }

    const [touch] = event.changedTouches

    if (event.touches.length !== 1 || touch === undefined) {
      gesture = { phase: 'ignored' }

      return
    }

    gesture = {
      canPull: canPullFrom(event.target, sheet),
      phase: 'undecided',
      pointerId: touchPointerId,
      startTime: event.timeStamp,
      startX: touch.clientX,
      startY: touch.clientY,
      target: touch.target,
      touchId: touch.identifier
    }
  }

  const onTouchMove = (event: TouchEvent): void => {
    if (gesture === null || gesture.phase === 'ignored') {
      return
    }

    const touch = findTouch(event.touches, gesture.touchId)

    if (touch === undefined) {
      return
    }

    if (gesture.phase === 'undecided') {
      const across = touch.clientX - gesture.startX
      const down = touch.clientY - gesture.startY

      if (Math.hypot(across, down) < DIRECTION_DISTANCE) {
        return
      }

      if (!gesture.canPull || down <= Math.abs(across)) {
        gesture = { phase: 'ignored' }

        return
      }

      cancelPress(gesture.target, gesture.pointerId)
      gesture = {
        phase: 'pulling',
        pull: startSheetPull({
          sheet,
          time: gesture.startTime,
          y: gesture.startY
        }),
        touchId: gesture.touchId
      }
    }

    event.preventDefault()
    moveSheetPull(gesture.pull, { time: event.timeStamp, y: touch.clientY })
  }

  const onTouchEnd = (event: TouchEvent): void => {
    if (gesture?.phase !== 'pulling') {
      if (event.touches.length === 0) {
        gesture = null
      }

      return
    }

    if (findTouch(event.changedTouches, gesture.touchId) === undefined) {
      return
    }

    const { pull } = gesture
    gesture = null
    releaseSheetPull(pull, onDismiss)
  }

  sheet.addEventListener('pointerdown', onPointerDown, { capture: true })
  sheet.addEventListener('touchstart', onTouchStart, { passive: true })
  sheet.addEventListener('touchmove', onTouchMove, { passive: false })
  sheet.addEventListener('touchend', onTouchEnd)
  sheet.addEventListener('touchcancel', onTouchEnd)

  return () => {
    sheet.removeEventListener('pointerdown', onPointerDown, { capture: true })
    sheet.removeEventListener('touchstart', onTouchStart)
    sheet.removeEventListener('touchmove', onTouchMove)
    sheet.removeEventListener('touchend', onTouchEnd)
    sheet.removeEventListener('touchcancel', onTouchEnd)
  }
}
