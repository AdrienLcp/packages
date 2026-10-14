import { useEffect, useSyncExternalStore } from 'react'

const SLASH = '/'
const COMMAND_KEY = 'k'

const APPLE_PLATFORM = /Mac|iPhone|iPad/

const isTypingInto = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))

const isCommandK = (event: KeyboardEvent): boolean =>
  event.key.toLowerCase() === COMMAND_KEY &&
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey

/**
 * `/` opens the search unless a field has the keyboard, or the page took the
 * key first: on the home page, `/` stays the export filter's, and Cmd or Ctrl
 * K opens the search from there as from everywhere. The listener sits on
 * `window`, so the page's own `document` listener has seen the key before it.
 */
export const useSiteSearchShortcut = (openSearch: () => void): void => {
  useEffect(() => {
    const openOnShortcut = (event: KeyboardEvent): void => {
      const isSlash =
        event.key === SLASH &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTypingInto(event.target)

      if (event.defaultPrevented || !(isSlash || isCommandK(event))) {
        return
      }

      event.preventDefault()
      openSearch()
    }

    window.addEventListener('keydown', openOnShortcut)

    return () => window.removeEventListener('keydown', openOnShortcut)
  }, [openSearch])
}

const subscribeToNothing = (): (() => void) => () => {}

const commandKeyLabel = (): string =>
  APPLE_PLATFORM.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'

/**
 * The shortcut as this keyboard writes it. The prerendered page cannot know
 * the platform, so it says Ctrl, and a Mac reads ⌘ once hydrated.
 */
export const useCommandKeyLabel = (): string =>
  useSyncExternalStore(subscribeToNothing, commandKeyLabel, () => 'Ctrl K')
