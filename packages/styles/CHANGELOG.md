# @adrienlcp/styles

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
