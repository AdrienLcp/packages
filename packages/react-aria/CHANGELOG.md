# @adrienlcp/react-aria

## 0.2.0

### Minor Changes

- 3cfcd12: `ring` and `ring-inset` take `$on`, a selector that draws the ring on a descendant of the focused element — a `Switch`'s track — and `ring-within` rings a box while a field inside it has focus, a `SearchField`'s `Group`

## 0.1.1

### Patch Changes

- f3e06a3: Add `classNames`, which joins class names and drops the falsy ones, and build `composeClassName` on it
- 5e76b8b: Point each package homepage to its entry on adrienlcp.com
- Updated dependencies [f3e06a3]
- Updated dependencies [5e76b8b]
  - @adrienlcp/react@0.4.0

## 0.1.0

### Minor Changes

- cd10c1b: First release: `composeClassName`, moved from `@adrienlcp/react` and built on react-aria's `composeRenderProps` and its own `ClassNameOrFunction`, and the Sass `focus` module (`ring`, `ring-inset`), moved from `@adrienlcp/styles`
