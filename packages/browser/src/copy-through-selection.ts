const findFocusedElement = (): HTMLElement | null =>
  document.activeElement instanceof HTMLElement &&
  document.activeElement !== document.body
    ? document.activeElement
    : null

/**
 * Copies by selecting a hidden, read-only textarea and asking the document to
 * copy the selection. `execCommand` is deprecated, and it is still the only
 * copy that works where the Clipboard API does not exist.
 *
 * The textarea sits next to the focused element, then hands focus back to it:
 * a modal dialog traps focus and closes when it leaves, so a textarea on
 * `document.body` would close the dialog that asked for the copy.
 */
export const copyThroughSelection = (text: string): boolean => {
  const focusedElement = findFocusedElement()
  const carrier = document.createElement('textarea')

  carrier.value = text
  carrier.setAttribute('readonly', '')
  carrier.setAttribute('aria-hidden', 'true')
  carrier.tabIndex = -1
  carrier.style.cssText = 'position:fixed;top:0;left:0;opacity:0'

  if (focusedElement === null) {
    document.body.append(carrier)
  } else {
    focusedElement.after(carrier)
  }

  carrier.focus({ preventScroll: true })
  carrier.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    carrier.remove()
    focusedElement?.focus({ preventScroll: true })
  }
}
