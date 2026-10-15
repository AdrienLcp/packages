import { useCallback, useSyncExternalStore } from 'react'

/**
 * Whether the screen answers `query` right now, following it as the window is
 * resized or turned. False on the server and through hydration, whose markup
 * must match it: a component that differs on a wide screen renders its narrow
 * face first there.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = matchMedia(query)

      media.addEventListener('change', onChange)

      return () => {
        media.removeEventListener('change', onChange)
      }
    },
    [query]
  )

  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false
  )
}
