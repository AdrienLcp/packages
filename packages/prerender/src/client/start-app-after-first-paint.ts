/**
 * Calls `start` once the prerendered page has painted. A module script can run
 * before the browser's first paint, and hydrating a whole page is a long task:
 * started at once, it holds that paint back by its own length. Waiting for the
 * next frame and the task after it lets the page the visitor came for paint
 * first, then the app takes it over. The module still downloads and runs as
 * Vite emits it: only the work it starts waits.
 *
 * A hidden tab runs no frame, so there `start` is called at once, as it is when
 * the tab goes hidden before the frame comes. Call it for a prerendered page
 * only: an empty root has nothing to paint before the app.
 */
export const startAppAfterFirstPaint = (start: () => void): void => {
  let hasStarted = false

  const startOnce = (): void => {
    if (hasStarted) {
      return
    }

    hasStarted = true
    document.removeEventListener('visibilitychange', startWhenHidden)
    start()
  }

  const startWhenHidden = (): void => {
    if (document.visibilityState === 'hidden') {
      startOnce()
    }
  }

  if (document.visibilityState === 'hidden') {
    startOnce()

    return
  }

  document.addEventListener('visibilitychange', startWhenHidden)
  requestAnimationFrame(() => {
    setTimeout(startOnce, 0)
  })
}
