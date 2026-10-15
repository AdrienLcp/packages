# @adrienlcp/react-aria

## 0.5.4

### Patch Changes

- 84a3d59: The sheet's scrim reaches the screen's edge on a page too short to scroll as well: the gutter is measured as the window's width less the viewport a fixed element fills, since Chromium's root `clientWidth` counts a stable gutter only while a scrollbar shows in it. A fractional gutter no longer leaves its padding on the root once the sheet is put away.

## 0.5.3

### Patch Changes

- 7f9143b: The sheet's scrim reaches the screen's edge in Chromium: the gutter is measured before react-aria's scroll lock and released after it. Measured after, with the overflow hidden, the root's `clientWidth` no longer counted the gutter's room and nothing was released.

## 0.5.2

### Patch Changes

- aa82071: The sheet's scrim reaches the screen's edge in a browser too, not only under test: the gutter is released after react-aria's scroll lock rather than before it, which found the page's scrollbar still showing and reserved its room again, so the page moved sideways by half a scrollbar and the strip stayed.

## 0.5.1

### Patch Changes

- 033371b: The sheet's scrim now reaches the screen's edge on a page with `scrollbar-gutter: stable`. A fixed element never paints over a reserved scrollbar gutter, and Chromium sizes `100vw` without it, so a bright strip was left down the scrim's side on a desktop browser in a narrow window. While the sheet is up, the gutter becomes padding on the root: the page keeps its width and the scrim covers it all.

## 0.5.0

### Minor Changes

- 284558e: `PopoverSheet` opens a popover beside its trigger on a screen that answers `wideQuery`, and below it a sheet rising from the bottom edge, which `SheetGrabber` pulls down past a quarter of its height or on a flick. The `sheet` Sass module ships the overlay, the sheet, the grabber and their keyframes; the look stays the app's. The sheet is a `Modal` with its own rise rather than react-aria's `Sheet`, whose smooth-scroll entrance no stylesheet can shorten.

### Patch Changes

- Updated dependencies [284558e]
  - @adrienlcp/browser@0.5.0

## 0.4.2

### Patch Changes

- Updated dependencies [60de920]
  - @adrienlcp/react@0.5.0

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
