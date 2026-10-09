# @adrienlcp/styles

## 0.18.0

### Minor Changes

- `measure-font` and `@adrienlcp/styles/font-metrics` move to `@adrienlcp/measure-font`, a dev dependency: fontkit, wawoff2 and capsize no longer reach an app's runtime dependencies. `fonts.fallback-faces` takes `$figures` as one ratio for every band, `$figure-separators` to draw `: . ,` in the figures face, `$stretch` for a width band, and `$size-adjust` defaults to `1` with `$widths` passed by name; a figures face now draws the line box of its band's letters under `$trimmed-to-capitals` instead of its own.
  
  Read every face the audit can resolve — a family in a variable, a family drawn only by `fallback-faces`, a family passed to a face mixin of the app's own — and fail loudly on the rest with `findUnreadFontFaces`; check fallback bands against the weights and styles the stylesheets set with `findFallbackBandFailures`; flag a family named in SVG or JSX instead of a font token with `findFontAttributeFailures`; read grid tracks in `findUnitFailures`, let a `--*-px` custom property hold pixels a script must match, and flag a fractional border or shared stroke (`fractional-stroke`); flag a raw `env(safe-area-inset-*)` and a hand-written side `max()` pair in `findUnnamedValues`. `--stroke-thin` and `--stroke-bold` default to `2px` and `3px`, whole pixels like the hairline: a `1.5px` stroke is the hairline on a 1x screen.
  
  An `accessibility.skip-link` mixin that clears the safe area, a `motion` module whose `arriving` plays an entrance on the first landing only, and a `sass-values` importer that serves values written in TypeScript — a breakpoint scripts read too — as a Sass module.

### Patch Changes

- e38bb13: Drop branches no input could reach: the font audit reads its regular expression captures by destructuring, `measure-font` checks its number options in one pass, a dictionary translation's options are read as the map they always are, and the prerender's `replaceFormatted` takes at least one node.

## 0.17.0

### Minor Changes

- be0c452: `fonts.fallback-faces` takes `$figures`, the digits' own ratio per band, and writes a face for `U+0030-0039` alone after each band: tabular figures no longer set narrower or wider in the fallback than the web font. `measure-font --figures` measures them, with `--figure-feature tnum` for the features they are set with, and `textWidth` takes those features. `measure-font` collapses the spaces and newlines of `--text` and `--text-file` as a browser lays them out — a raw newline widened every ratio by about 2 % — and refuses a text that is spaces alone instead of printing `NaN`.

## 0.16.0

### Minor Changes

- ec721da: Measure a self-hosted font for its fallback faces with the `measure-font` bin and `@adrienlcp/styles/font-metrics`: the zero's advance in em at any weight, to convert a `ch`; each `$widths` ratio of `fonts.fallback-faces` — the band's Arial cut scaled by `size-adjust`, over the web font at that weight —, fontaine's `size-adjust`, and the capital height, read from the `H` when the `OS/2` table has none. `fonts.fallback-faces` takes `$style: italic`, drawn in Arial Italic and Arial Bold Italic, which `metricTwins()` now widens to their twins. The audit lists a font token that names a web font without its `'<family> fallback'` face — fontaine never adds it inside a custom property — with `findFallbackFailures` and `webFontFamilies`.

## 0.15.0

### Minor Changes

- 0b5d199: Pad a page's sides by `--gutter-left` and `--gutter-right`, `--gutter` or the inset a landscape notch covers. Measure `--measure` in `em` (`34em`): a `ch` column rewraps when the web font replaces the fallback, and the audit now lists every `ch` size. List an outline width that is not a whole number of pixels, which Chromium draws thinner on a 1x screen. Let a scroll-driven animation keep moving under `reduced-motion.css` with `--reduced-motion-duration: auto`. Write a fallback face per weight band with `fonts.fallback-faces`, and widen the bold cuts of Arial, Courier New and Times New Roman to their metric twins.

## 0.14.0

### Minor Changes

- 42ea93d: `fonts.font-face` defaults to `font-display: optional` instead of `swap`: a font that misses the first ~100 ms stays out until the next page, so it never swaps in under a reader and shifts the layout. Pass `$display: swap` to keep the old behaviour.

## 0.13.0

### Minor Changes

- 585e2f6: `@adrienlcp/styles/metric-twins`: `metricTwins()`, a PostCSS plugin listed after `fontaine/postcss` that widens each fallback face naming Arial, Courier New or Times New Roman alone to the fonts drawn on the same metrics (Liberation, Arimo, Cousine, Tinos, Roboto), so the face loads on Linux and Android and the web font swap moves no line. `METRIC_TWINS` and `withMetricTwins` come with it.

### Patch Changes

- 40938ca: `ring-focusables` skips what react-aria's `VisuallyHidden` clips — the input under a `Switch`, a `Checkbox`, a `Radio` — and what sits inside it, so the hidden input no longer draws a ring beside the visible control.

## 0.12.0

### Minor Changes

- 22f370c: The audit reads what apps actually write. `findUnitFailures` also catches a `px` inside a `transform`'s `translate*()` and lets a zero pass in any unit. `findUnnamedValues` flags a `font-size` written as a literal (`text-size`). `findTokenFailures` skips comments and interpolated names (`--g#{$n}`, `--pawn-${n}`), takes `{ provided }` for names a library sets at runtime, narrows `parallel` to a size step, a size word or a bare length (so `--target-reach` and `--control-ink` pass), and adds `alias`: a second name for a distinctive `defaults` value, such as `--timing` holding `--ease-out`. `SHARED_TOKEN_DEFAULTS` maps each default token to its value. `tokens.defaults` declares `--safe-area-top`, `--safe-area-right`, `--safe-area-bottom` and `--safe-area-left`. `reset.css` documents its one `!important` for Biome.

## 0.11.0

### Minor Changes

- 2dfc163: Check more of what a stylesheet must name: findUnitFailures now reads box sizes, offsets, translations and every custom property outside the pixel families; findUnnamedValues flags a literal radius or duration; findTokenFailures flags a custom property read but declared nowhere, or a parallel name beside a shared one. tokens.defaults declares the --transition-* durations and --ease-out, the breakpoint is 56.25rem, the reset isolates #root, and both focus modules gain ring-focusables and an $offset on ring and ring-within.

## 0.10.0

### Minor Changes

- 3cfcd12: Remove `sizes.rem()`: write a size in rem directly, or take it from a token, and `findUnitFailures` flags a `px` text size or spacing again wherever it is written. `tokens.defaults` renames `--control-touch` to `--control-height`, a drawn control's height at `2.75rem` that never falls below `--target`. `ring` and `ring-inset` take `$on`, a selector that draws the ring on a descendant of the focused element, and `ring-within` rings a box while a field inside it has focus

## 0.9.1

### Patch Changes

- 56e5308: `findUnitFailures` no longer flags a size handed to `rem()` in pixels — `sizes.rem(13px)` is the conversion the rule asks for

## 0.9.0

### Minor Changes

- b751137: Add `sizes` and `audit`: `sizes.fluid($min, $max)` writes a rem size that grows with the viewport and refuses a range a 200 % zoom could not double, `sizes.rem(14px)` converts a design file's pixels, `findUnitFailures(stylesheet)` lists every text size or spacing in `px` and every text size driven by the viewport with no rem part, and `findTypeLiterals(stylesheet)` every weight, leading or tracking written outside the typography mixins. `text-box` adds `trimmed-block($padding)` and `trimmed-figure`, which centre a one-line label on its ink. `tokens.defaults` adds `--icon-s`, `--icon-m` and `--icon-l`. `reset.css` keeps `[hidden]` hidden over a component's `display`, scrolls anchors to `--scroll-offset`, breaks long words in headings and paragraphs, balances `h5` and `h6`, smooths fonts on macOS Firefox and resizes a textarea only vertically. `reduced-motion.css` ends every keyframe animation at once

## 0.8.0

### Minor Changes

- 168e500: `reset.css` gives buttons `touch-action: manipulation`, so a tap fires without waiting out a double-tap zoom, and links inherit their parent's color while keeping their underline

## 0.7.0

### Minor Changes

- eadb563: `reset.css` removes the mobile tap highlight: a pressable shows its own pressed style instead of the browser's rectangle

## 0.6.2

### Patch Changes

- 5a3c1b3: `contrast` reads colours, composites them and measures their WCAG contrast through culori, and reads a token whose value runs over several lines, an upper-case `oklch()` or hex, and a `var()` fallback followed by a space

## 0.6.1

### Patch Changes

- 5e76b8b: Point each package homepage to its entry on adrienlcp.com
- Updated dependencies [5e76b8b]
  - @adrienlcp/result@0.1.1

## 0.6.0

### Minor Changes

- 359198a: `tokens`, `accessibility` and `spread` Sass modules: default values for the tokens every app names the same way (strokes, hairlines, the focus ring, the touch target, the measure), `visually-hidden`, `ring` and `ring-inset` mixins, and a two-column ruled `columns` spread.

## 0.5.0

### Minor Changes

- ed9283b: Add `contrast`: `findContrastFailures(stylesheet, pairs)` reads the colour tokens a stylesheet declares, follows `var()` and `light-dark()`, and lists every pair under its WCAG minimum in either scheme, so a test fails before a low-contrast palette ships. `WCAG_AA` holds the level AA ratios

## 0.4.1

### Patch Changes

- a028ef4: `reduced-motion.css` stills `::view-transition-image-pair` too, where an app animates a morph it names.

## 0.4.0

### Minor Changes

- fddc293: `reduced-motion.css` stills view transitions too, which React's `<ViewTransition>` starts whatever the preference.

## 0.3.0

### Minor Changes

- b304b44: Add `containers`: `container`, `container-wide` and `container-narrow`, so a component answers its container instead of the screen. `reset.css` sets `interpolate-size: allow-keywords` on `html`, so a transition reaches `height: auto`

## 0.2.0

### Minor Changes

- cd10c1b: The `focus` module moves to `@adrienlcp/react-aria/focus`, without `hovered`: react-aria's `[data-hovered]` already ignores the hover a touch screen emulates, so a hover style is a plain `&[data-hovered]` rule

## 0.1.0

### Minor Changes

- e92e6cc: First release: a reset, a reduced-motion switch, and Sass mixins for self-hosted fonts, a breakpoint, focus rings and pointer-only hover
