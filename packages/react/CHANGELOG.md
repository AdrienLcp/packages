# @adrienlcp/react

## 0.5.0

### Minor Changes

- 60de920: Keep in the package only what two projects use. Removed `Animate` and `AnimateProps`, which no project used, and `staggerStyle` with `StaggerStyle`, moved into list, its one user.

## 0.4.0

### Minor Changes

- f3e06a3: Add `classNames`, which joins class names and drops the falsy ones, and build `composeClassName` on it

### Patch Changes

- 5e76b8b: Point each package homepage to its entry on adrienlcp.com

## 0.3.0

### Minor Changes

- fddc293: Add `Animate`, which keeps an element rendered with `data-exiting` until its CSS transitions end, and `staggerStyle`. React 19.2 is now the minimum peer.

## 0.2.0

### Minor Changes

- cd10c1b: `composeClassName` and `ClassNameOrFunction` move to `@adrienlcp/react-aria`: this package keeps generic React only
