import { Result } from '@adrienlcp/result'

/** Stops holding the screen awake and releases the lock if it is held. */
export type StopKeepingScreenAwake = () => void

const isWakeLockSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator

/**
 * Holds the screen awake until the returned function is called, taking the
 * lock again every time the document comes back into view: a browser releases
 * it when the tab is hidden and never gives it back on its own.
 *
 * Fails with `'unsupported'` where there is no Wake Lock API — before Safari
 * 16.4, and outside a secure context. Once running, a refused or revoked
 * request (a phone low on battery may do either at any moment) is not
 * reported: the screen sleeps as it always did, and the lock is asked for
 * again the next time the tab returns.
 *
 * Playing audio or video does not stand in for it: Chromium's media wake lock
 * needs a video track, so a page playing sound lets its screen sleep.
 */
export const keepScreenAwake = (): Result<
  StopKeepingScreenAwake,
  'unsupported'
> => {
  if (!isWakeLockSupported()) {
    return Result.failure('unsupported')
  }

  let sentinel: WakeLockSentinel | null = null
  let isRequesting = false
  let isWanted = true

  const isHeld = (): boolean => sentinel !== null && !sentinel.released

  const requestUnlessRefused = async (): Promise<void> => {
    if (!isWanted || isRequesting || isHeld() || document.hidden) {
      return
    }

    isRequesting = true

    try {
      const taken = await navigator.wakeLock.request('screen')

      if (isWanted) {
        sentinel = taken
      } else {
        await taken.release()
      }
    } catch {
      return
    } finally {
      isRequesting = false
    }
  }

  const requestOnReturn = (): void => {
    void requestUnlessRefused()
  }

  document.addEventListener('visibilitychange', requestOnReturn)
  void requestUnlessRefused()

  return Result.success(() => {
    isWanted = false
    document.removeEventListener('visibilitychange', requestOnReturn)

    if (isHeld()) {
      void sentinel?.release()
    }

    sentinel = null
  })
}
