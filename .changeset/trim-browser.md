---
'@adrienlcp/browser': minor
---

Keep in the package only what two projects use. Removed:

- `endLanding` and `LANDING_ATTRIBUTE`: no project called them.
- `usePrefersReducedMotion`, from `@adrienlcp/browser` and `@adrienlcp/browser/react`: moved into sport, its one user. `subscribeToReducedMotion`, which only that hook used, goes with it.
- `keepScreenAwake`, `StopKeepingScreenAwake` and `REDUCED_MOTION_QUERY` are no longer exported: `useScreenAwake` and `prefersReducedMotion` are the public calls, and run them as before.

- `useScreenAwake` is no longer exported from `@adrienlcp/browser`: import it from `@adrienlcp/browser/react`, which now holds it alone, so the root entry no longer pulls in React.
