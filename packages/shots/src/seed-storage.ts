/**
 * Runs in the page, before any of its scripts: writes each entry into
 * `localStorage`. Self-contained, since Playwright sends its source text alone.
 * Storage the page refuses stays as it is: the shot then shows the app's own
 * fallback, which is worth seeing too.
 */
export const seedStorage = (
  entries: Readonly<Record<string, string>>
): void => {
  for (const [key, value] of Object.entries(entries)) {
    try {
      localStorage.setItem(key, value)
    } catch {
      return
    }
  }
}
