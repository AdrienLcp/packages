/**
 * Copies by selecting a hidden, read-only textarea and asking the document to
 * copy the selection. `execCommand` is deprecated, and it is still the only
 * copy that works where the Clipboard API does not exist.
 */
export const copyThroughSelection = (text: string): boolean => {
  const carrier = document.createElement('textarea')

  carrier.value = text
  carrier.setAttribute('readonly', '')
  carrier.style.cssText = 'position:fixed;opacity:0'
  document.body.append(carrier)
  carrier.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    carrier.remove()
  }
}
