/**
 * The attribute the shell's `<html>` carries while the visitor's first page is
 * landing. `@adrienlcp/styles/motion`'s `arriving` animates only under it.
 */
export const LANDING_ATTRIBUTE = 'data-landing'

/**
 * Ends the first landing: what `arriving` animates no longer does. Call it on
 * the router's first navigation, so a page reached in the app appears without
 * the entrance, and right before `createRoot` replaces prerendered markup,
 * which would otherwise play the entrance a second time over the same page.
 * Does nothing where there is no `document`, as on a server.
 */
export const endLanding = (): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute(LANDING_ATTRIBUTE)
  }
}
