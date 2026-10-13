# @adrienlcp/browser

## 0.4.0

### Minor Changes

- 60de920: Keep in the package only what two projects use. Removed:
  
  - `endLanding` and `LANDING_ATTRIBUTE`: no project called them.
  - `usePrefersReducedMotion`, from `@adrienlcp/browser` and `@adrienlcp/browser/react`: moved into sport, its one user. `subscribeToReducedMotion`, which only that hook used, goes with it.
  - `keepScreenAwake`, `StopKeepingScreenAwake` and `REDUCED_MOTION_QUERY` are no longer exported: `useScreenAwake` and `prefersReducedMotion` are the public calls, and run them as before.
  
  - `useScreenAwake` is no longer exported from `@adrienlcp/browser`: import it from `@adrienlcp/browser/react`, which now holds it alone, so the root entry no longer pulls in React.

## 0.3.0

### Minor Changes

- `readDurationSeconds` reads a `<time>` custom property as seconds, and `endLanding` takes the shell's `data-landing` mark off once the visitor has landed.

## 0.2.1

### Patch Changes

- 5e76b8b: Point each package homepage to its entry on adrienlcp.com
- Updated dependencies [5e76b8b]
  - @adrienlcp/result@0.1.1

## 0.2.0

### Minor Changes

- 1f53002: `reloadPage()` reloads the page through `location.reload()`, and does nothing where there is no `location`, as on a server.

## 0.1.1

### Patch Changes

- e742dd1: Keep a modal dialog open when the selection copy runs from inside it: the hidden textarea now sits next to the focused element, and focus goes back to that element after the copy.
