import { useEffect } from 'react'

import { keepScreenAwake } from './keep-screen-awake.ts'

/**
 * Holds the screen awake while `isWanted` is true and the component is
 * mounted. Where the Wake Lock API is missing it does nothing: the screen
 * sleeps as it always did.
 */
export const useScreenAwake = (isWanted: boolean): void => {
  useEffect(() => {
    if (!isWanted) {
      return
    }

    const kept = keepScreenAwake()

    return kept.status === 'success' ? kept.data : undefined
  }, [isWanted])
}
