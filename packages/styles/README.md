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
| `reset.css` | Box sizing, zeroed margins and paddings, inherited fonts on controls, bare buttons and lists, balanced headings, pretty paragraphs, and `interpolate-size: allow-keywords` so a transition reaches `height: auto` (Chromium; elsewhere the size snaps as before). Inside `@layer reset` |
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
