# @adrienlcp/react-aria

## 0.4.1

### Patch Changes

- 40938ca: `ring-focusables` skips what react-aria's `VisuallyHidden` clips — the input under a `Switch`, a `Checkbox`, a `Radio` — and what sits inside it, so the hidden input no longer draws a ring beside the visible control.

## 0.4.0

### Minor Changes

- 22f370c: `REACT_ARIA_TOKENS` lists the custom properties react-aria-components sets at runtime (`--trigger-width`, `--disclosure-panel-height`, `--visual-viewport-height`…), to pass to `findTokenFailures` as `provided`.

## 0.3.0

### Minor Changes

- 2dfc163: Check more of what a stylesheet must name: findUnitFailures now reads box sizes, offsets, translations and every custom property outside the pixel families; findUnnamedValues flags a literal radius or duration; findTokenFailures flags a custom property read but declared nowhere, or a parallel name beside a shared one. tokens.defaults declares the --transition-* durations and --ease-out, the breakpoint is 56.25rem, the reset isolates #root, and both focus modules gain ring-focusables and an $offset on ring and ring-within.

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
