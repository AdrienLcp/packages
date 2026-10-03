import { type RefObject, useEffect } from 'react'

const SEARCH_SHORTCUT = '/'

const isTypingInto = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))

/** `/` focuses the search field from anywhere on the page, unless a field has the keyboard. */
export const useSearchShortcut = (
  inputRef: RefObject<HTMLInputElement | null>
): string => {
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent): void => {
      if (
        event.key !== SEARCH_SHORTCUT ||
        event.ctrlKey ||
        event.metaKey ||
        isTypingInto(event.target)
      ) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
    }

    document.addEventListener('keydown', focusSearch)

    return () => document.removeEventListener('keydown', focusSearch)
  }, [inputRef])

  return SEARCH_SHORTCUT
}
