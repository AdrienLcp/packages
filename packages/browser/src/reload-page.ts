/**
 * Reloads the page, the way out a crash screen offers. Does nothing where there
 * is no `location`, as on a server, so a handler built from it can be passed
 * down from code that also renders there.
 */
export const reloadPage = (): void => {
  if (typeof location !== 'undefined') {
    location.reload()
  }
}
