# @adrienlcp/styles

The styling floor every app of mine starts from: a reset, a reduced-motion
switch, and the Sass mixins that CSS cannot write yet. Plain `.css` for what
CSS can say, `.sass` only for what it cannot — a custom property is not allowed
in a media query or in `unicode-range`, and CSS has no mixins.

```bash
pnpm add @adrienlcp/styles
```

## Plain CSS

| File | Does |
| --- | --- |
| `reset.css` | Box sizing, zeroed margins and paddings, inherited fonts on controls, bare buttons that fire on the first tap (`touch-action: manipulation`), links in their parent's color with their underline kept, bare lists, balanced headings, pretty paragraphs, and `interpolate-size: allow-keywords` so a transition reaches `height: auto` (Chromium; elsewhere the size snaps as before), and no tap highlight on mobile — every pressable then owes its own pressed style. Inside `@layer reset` |
| `reduced-motion.css` | Collapses `--transition-fast`, `--transition-base` and `--transition-slow` to `0ms` under `prefers-reduced-motion: reduce`, and stills view transitions, which React's `<ViewTransition>` starts whatever the preference. Unlayered, so it beats the tokens wherever they are defined |

Import them once — from JavaScript, or from the global stylesheet in Sass:

```sass
@use '@adrienlcp/styles/reset.css'
@use '@adrienlcp/styles/reduced-motion.css'
```

`reset.css` declares a layer: set the order in the document head before any
stylesheet loads, so the reset stays under every component rule —
`<style>@layer reset, tokens, base, components;</style>`.

## Sass

Resolved through the `sass` export condition, which Vite reads; with the Sass
CLI, use `pkg:@adrienlcp/styles/breakpoints` and `--pkg-importer=node`.

### `containers`

A component answers the room it is given, not the screen: the same card
lays out the same way in a sidebar on a desktop and full width on a phone.

```sass
@use '@adrienlcp/styles/containers'

.card
  @include containers.container

  .card-body
    @include containers.container-wide(30rem)
      grid-template-columns: auto 1fr
```

- `container($name: null)` sets `container-type: inline-size`, and
  `container-name` when given one.
- `container-wide($width, $name: null)` is `width >= $width` on the nearest
  container, or on the one named; `container-narrow` is its exact complement.
- **An element queries an ancestor, never itself** — the container wraps what
  changes.
- **A container no longer takes its width from its content**: inside a flex row
  without a width, an `auto` grid track or an absolutely positioned box, it
  collapses to zero. Its parent gives it a width.
- **With no container above, neither mixin matches.** Make `body` one in the
  global stylesheet, so an unwrapped component falls back to the page width;
  `position: fixed` stays on the viewport.
- The width is Sass interpolated into `@container`, so pass a value, not a
  custom property — `@container` cannot read one either.

### `breakpoints`

For what depends on the device rather than the room a component has: the page
shell, a sidebar that turns into a drawer, an overlay pinned to the viewport.

```sass
@use '@adrienlcp/styles/breakpoints'

.shell
  @include breakpoints.wide
    grid-template-columns: 16rem 1fr
```

`$wide-screen` is `900px`; `wide` is `width >= $wide-screen` and `narrow` its
exact complement. Another value: `@use '@adrienlcp/styles/breakpoints' with
($wide-screen: 1024px)`.

### `fonts`

`$latin` and `$latin-ext` are the unicode ranges Google Fonts cuts a Latin face
into; `font-face` declares one self-hosted `woff2` file.

```sass
@use '@adrienlcp/styles/fonts'

@include fonts.font-face('Archivo', '/fonts/archivo-latin.woff2', fonts.$latin, $weight: 100 900, $stretch: 62% 125%)
@include fonts.font-face('Archivo', '/fonts/archivo-latin-ext.woff2', fonts.$latin-ext, $weight: 100 900, $stretch: 62% 125%)
```

`$weight`, `$style` (`normal`), `$stretch` (left out) and `$display` (`swap`)
are optional.

### `tokens`

The tokens every app names the same way, so an app sets values, not names.
Include `defaults` first in the app's `:root`; what the app declares after it
wins.

```sass
@use '@adrienlcp/styles/tokens'

@layer tokens
  :root
    @include tokens.defaults
    --measure: 62ch
```

| Token | Default |
| --- | --- |
| `--stroke-hair`, `--stroke-thin`, `--stroke-bold` | `1px`, `1.5px`, `2px` |
| `--hairline`, `--hairline-strong` | a `--stroke-hair` solid line in `--rule`, `--rule-strong` |
| `--inset-hairline`, `--inset-hairline-strong` | the same line as an inset `box-shadow`, which takes no room |
| `--outline-thick`, `--outline-offset` | `2px`, `3px` |
| `--ring`, `--ring-offset`, `--ring-inset` | an `--outline-thick` solid outline in `--focus`, drawn `--outline-offset` outside the box or inside it |
| `--underline-offset`, `--tracking-tight` | `0.24em`, `-0.02em` |
| `--target`, `--control-touch` | `44px`, the smallest touch target |
| `--measure` | `65ch` |

`--rule`, `--rule-strong` and `--focus` are the app's palette. Until it declares
them, a line is `currentColor` mixed toward transparent and the ring is
`currentColor`: never invisible.

### `accessibility`

```sass
@use '@adrienlcp/styles/accessibility'

.icon-label
  @include accessibility.visually-hidden

.button
  @include accessibility.ring
```

- `visually-hidden` hides from sight, not from a screen reader.
- `ring` draws `--ring` on keyboard focus only: `:focus-visible` for a native
  element, `[data-focus-visible]` for one react-aria marks. `ring-inset` draws
  it inside the box, for a row that fills its container edge to edge or sits
  in an ancestor that clips. An app on `@adrienlcp/react-aria` has the same
  pair in its `focus` module.

### `spread`

A page of two columns: `.columns` holding two `.column`s, stacked and ruled
apart under `breakpoints.wide`, side by side above it with the rule running the
full height between them.

```sass
@use '@adrienlcp/styles/spread'

.settings-page
  @include spread.columns($gap: var(--space-m))
```

`$gap` spaces a column's own items; `$rule` (`--hairline`), `$stacked-gap`
(`--space-l`) and `$spread-gap` (`--space-2xl`) are optional.

## TypeScript

### `contrast`

A palette is checked where it is written, not by eye: a test lists the token
pairs that meet on screen, and fails when one falls under its WCAG minimum in
the light or the dark scheme.

```ts
import { readFileSync } from 'node:fs'

import { findContrastFailures, WCAG_AA } from '@adrienlcp/styles/contrast'
import { expect, it } from 'vitest'

const TOKENS = readFileSync(new URL('_tokens.sass', import.meta.url), 'utf8')

it('every ink reads on every surface, in both themes', () => {
  expect(
    findContrastFailures(TOKENS, [
      { foreground: '--ink-soft', background: '--ground', minimum: WCAG_AA.text },
      { foreground: '--focus', background: '--ground', minimum: WCAG_AA.nonText }
    ])
  ).toEqual([])
})
```

- `WCAG_AA` is `text` (4.5), `largeText` and `nonText` (3) — controls, icons,
  focus rings.
- The stylesheet is `.css` or indented `.sass`. A token is `oklch()` or hex,
  `light-dark()` of those, or `var()` of another token.
- A failure is `too-low`, with the ratio and the schemes it fails in, or
  `unreadable`: a token undeclared, declared twice with different values, a
  reference loop, a colour it cannot read (computed, or another notation), or a
  translucent background — what shows through decides that contrast.
- A translucent foreground is measured over its background. An `oklch()`
  outside sRGB is clipped, as an sRGB screen draws it.
