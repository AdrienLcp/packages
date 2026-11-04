import type React from 'react'
import { useContext, useEffect, useRef } from 'react'
import { OverlayTriggerStateContext } from 'react-aria-components'

type CloseWatcherConstructor = new () => EventTarget & { destroy: () => void }

/** TypeScript's DOM types leave `CloseWatcher` out until a second engine ships it. */
const isCloseWatcherConstructor = (
  value: unknown
): value is CloseWatcherConstructor => typeof value === 'function'

/**
 * Closes the overlay its `DialogTrigger` opened on the system's back gesture,
 * through the browser's `CloseWatcher` — Chromium's, whose Android back
 * gesture it answers — instead of leaving the page. It watches for as long as
 * it is mounted, so the next back gesture after the overlay goes is the
 * page's again. A browser without one keeps its back gesture as it was.
 */
export const CloseOnBack: React.FC = () => {
  const state = useContext(OverlayTriggerStateContext)
  const closeRef = useRef(state?.close)

  useEffect(() => {
    closeRef.current = state?.close
  })

  useEffect(() => {
    const closeWatcher: unknown = Reflect.get(globalThis, 'CloseWatcher')

    if (!isCloseWatcherConstructor(closeWatcher)) {
      return
    }

    const watcher = new closeWatcher()
    watcher.addEventListener('close', () => {
      closeRef.current?.()
    })

    return () => {
      watcher.destroy()
    }
  }, [])

  return null
}
