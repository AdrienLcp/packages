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
| `reset.css` | Box sizing, zeroed margins and paddings, inherited fonts on controls, bare buttons and lists, balanced headings, pretty paragraphs. Inside `@layer reset` |
| `reduced-motion.css` | Collapses `--transition-fast`, `--transition-base` and `--transition-slow` to `0ms` under `prefers-reduced-motion: reduce`. Unlayered, so it beats the tokens wherever they are defined |

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
CLI, use `pkg:@adrienlcp/styles/focus` and `--pkg-importer=node`.

### `breakpoints`

```sass
@use '@adrienlcp/styles/breakpoints'

.page
  @include breakpoints.wide
    grid-template-columns: 1fr 1fr
```

`$wide-screen` is `900px`; `wide` is `width >= $wide-screen` and `narrow` its
exact complement. Another value: `@use '@adrienlcp/styles/breakpoints' with
($wide-screen: 1024px)`.

### `focus`

`ring` and `ring-inset` draw the outline on `[data-focus-visible]` (react-aria)
and `:focus-visible` (a native element). `hovered` wraps a hover style in
`(hover: hover) and (pointer: fine)`, since a touch screen replays hover after a
tap and leaves it stuck; `$except` skips a state.

```sass
@use '@adrienlcp/styles/focus'

.button
  @include focus.ring

  @include focus.hovered($except: '[data-disabled]')
    background: var(--hover)
```

Configure the ring once, in the app's own `_focus.sass`, and have components
`@use` that file:

```sass
@forward '@adrienlcp/styles/focus' with ($ring-color: var(--focus), $ring-offset: 3px, $ring-width: 3px)
```

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
