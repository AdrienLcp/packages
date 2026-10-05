# @adrienlcp/styles

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
