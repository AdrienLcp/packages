import { SHEET_DRAG_OFFSET } from './sheet-drag-offset.ts'

/** A pull past this share of the sheet's height puts it away. */
const DISMISS_SHARE = 0.25
/** A flick faster than this, in pixels per millisecond, puts it away whatever the distance. */
const DISMISS_VELOCITY = 0.6
/** How far an upward pull moves the sheet for each pixel the thumb goes: it gives, then holds. */
const UPWARD_GIVE = 1 / 6

/** A pull under way, whatever started it: the grabber's pointer or a touch on the content. */
export type SheetPull = {
  lastTime: number
  lastY: number
  sheet: HTMLElement
  startY: number
  velocity: number
}

type PullPoint = {
  /** The event's `timeStamp`, in milliseconds. */
  time: number
  /** The thumb's `clientY`. */
  y: number
}

export const startSheetPull = ({
  sheet,
  time,
  y
}: PullPoint & { sheet: HTMLElement }): SheetPull => {
  delete sheet.dataset.settling

  return { lastTime: time, lastY: y, sheet, startY: y, velocity: 0 }
}

/** Moves the sheet with the thumb, and remembers how fast it went for the release. */
export const moveSheetPull = (
  pull: SheetPull,
  { time, y }: PullPoint
): void => {
  const elapsed = Math.max(1, time - pull.lastTime)
  pull.velocity = (y - pull.lastY) / elapsed
  pull.lastY = y
  pull.lastTime = time

  const offset = y - pull.startY
  pull.sheet.style.setProperty(
    SHEET_DRAG_OFFSET,
    `${offset > 0 ? offset : offset * UPWARD_GIVE}px`
  )
}

/**
 * Ends a pull: past a quarter of the sheet's height, or on a flick, it calls
 * `onDismiss`; short of that, the sheet settles back where it was.
 */
export const releaseSheetPull = (
  pull: SheetPull,
  onDismiss: () => void
): void => {
  const offset = pull.lastY - pull.startY
  const isDismissed =
    offset > pull.sheet.offsetHeight * DISMISS_SHARE ||
    pull.velocity > DISMISS_VELOCITY

  if (isDismissed) {
    onDismiss()

    return
  }

  const { sheet } = pull
  sheet.dataset.settling = ''
  sheet.style.removeProperty(SHEET_DRAG_OFFSET)
  sheet.addEventListener(
    'transitionend',
    () => {
      delete sheet.dataset.settling
    },
    { once: true }
  )
}
