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
| `reset.css` | Box sizing, zeroed margins and paddings, inherited fonts on controls, bare buttons that fire on the first tap (`touch-action: manipulation`), links in their parent's color with their underline kept, bare lists, balanced headings, pretty paragraphs, and `interpolate-size: allow-keywords` so a transition reaches `height: auto` (Chromium; elsewhere the size snaps as before), no tap highlight on mobile — every pressable then owes its own pressed style —, headings and paragraphs that break a long word rather than overflow, a textarea that resizes only vertically, anchors that scroll to `--scroll-offset` below the top (the height of a sticky header, `0px` until set), and `#root` isolated so a `z-index` inside the app never climbs over an overlay portalled to `body`. It leaves out what an app decides: `scrollbar-gutter`, `font-synthesis`, `field-sizing` on a textarea, and smooth scrolling, which would also animate the router's scroll on every navigation. Inside `@layer reset`, except `[hidden]`, kept hidden whatever `display` a component gives it |
| `reduced-motion.css` | Collapses `--transition-fast`, `--transition-base` and `--transition-slow` to `0ms` under `prefers-reduced-motion: reduce`, ends every keyframe animation at once, looping ones included, and stills view transitions, which React's `<ViewTransition>` starts whatever the preference. Unlayered, so it beats the tokens wherever they are defined. A scroll-driven animation moves only as the reader scrolls, and a zero duration pins it to its last frame: its element declares `--reduced-motion-duration: auto`, which reaches none of its descendants |

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

`$wide-screen` is `56.25rem` — rem in a media query reads the browser's font
size, so a user who raises it gets the narrow layout sooner. `wide` is
`width >= $wide-screen` and `narrow` its exact complement. Another value:
`@use '@adrienlcp/styles/breakpoints' with ($wide-screen: 64rem)`; a container
threshold that follows the shell takes the same value.

#### One source for a breakpoint scripts read too

A breakpoint that `matchMedia` answers to as well lives in TypeScript, and
`sassValues` (below, under TypeScript) hands it to Sass: one line in
`vite.config.ts`, one `@use` in the layout module.

```ts
// src/presentation/styles/screen-sizes.ts
export const SCREEN_SIZES = { shortScreen: '30rem', wideScreen: '40rem' } as const

// vite.config.ts
css: { preprocessorOptions: { sass: { importers: [sassValues({ 'screen-sizes': SCREEN_SIZES })] } } }
```

```sass
// _layout.sass
@use 'values:screen-sizes'
@forward '@adrienlcp/styles/breakpoints' with ($wide-screen: screen-sizes.$wide-screen)
```

### `fonts`

`$latin` and `$latin-ext` are the unicode ranges Google Fonts cuts a Latin face
into; `font-face` declares one self-hosted `woff2` file.

```sass
@use '@adrienlcp/styles/fonts'

@include fonts.font-face('Archivo', '/fonts/archivo-latin.woff2', fonts.$latin, $weight: 100 900, $stretch: 62% 125%)
@include fonts.font-face('Archivo', '/fonts/archivo-latin-ext.woff2', fonts.$latin-ext, $weight: 100 900, $stretch: 62% 125%)
```

`$weight`, `$style` (`normal`), `$stretch` (left out) and `$display`
(`optional`) are optional. `optional` keeps the fallback face for the page's
whole life when the font misses the first ~100 ms, so the font never swaps in
under a reader and moves a line; it is cached for the next page. Its preload
keeps the default priority: `fetchpriority="low"` makes it miss those 100 ms
on purpose.

`fallback-faces` writes a fallback face per weight band of a variable font,
for the font fontaine scales poorly: fontaine writes one face for the whole
font, measured at its default instance, so a heavier weight wraps later in
Arial than in the web font.

```sass
@include fonts.fallback-faces('Sofia Sans', (ascent: 0.9, descent: 0.3, cap-height: 0.655), 0.964556, (300 449: 1.0094, 450 649: 1.0058, 650 800: 1.0567), $trimmed-to-capitals: true)
```

- `$metrics` is the web font's `ascent`, `descent` and `cap-height` in em, read
  from its `hhea` and `OS/2` tables; `$size-adjust` the ratio fontaine computes
  for the file.
- Each `$widths` entry maps a weight range to a **width ratio**: the band's
  Arial cut scaled by `$size-adjust`, over the web font at the weight that
  band's text is set in, both measured over the app's own text —
  `(arial × size-adjust) / web font`. The face is scaled by `$size-adjust`
  divided by that ratio, so it sets the text exactly as wide as the web font.
  A ratio above 1 means scaled Arial is still too wide. `measure-font` prints
  them.
- A band from `$bold-from` (`650`) up is drawn in `Arial Bold`, and its ratio
  is measured over Arial Bold: a face that declares its weights is never
  synthesised bolder.
- `$style: italic` writes the faces for the italic files, drawn in
  `Arial Italic` and `Arial Bold Italic` and measured over them. Without
  them italic text in the fallback takes the upright face — slanted by
  synthesis at best, upright under `font-synthesis: none` — at upright
  widths. Any other style is a compile error.
- `$figures` maps the same ranges to the **digits' own ratio**, measured over
  `0123456789` with the features they are set with — `measure-font --figures
  --figure-feature tnum --figure-feature lnum` for `tabular-nums lining-nums`.
  Each band gets a second face for `U+0030-0039` alone, written after it so it
  wins for the digits. One ratio cannot cover both when the font's digits
  stand to Arial's otherwise than its letters do: Barlow Condensed's tabular
  figures set ~14 % narrower in a face scaled on its letters, and a score
  jumps when the web font lands. A range missing from `$figures` is a compile
  error.
- `$trimmed-to-capitals` moves ascent and descent by the gap between the two
  capital heights, their sum kept, so a title trimmed to its capitals starts at
  the same height in both faces.
- The faces are named `<family> fallback`, as fontaine names its own: skip the
  family in fontaine's `skipFontFaceGeneration`, and list `metricTwins()`
  after it for Linux and Android.

**A font token names the fallback face itself.** fontaine appends
`'<family> fallback'` to a `font-family` declaration it reads, never to a
custom property: a token keeps the family alone, and the metric-matched face
is never used. Write it in:

```sass
--font-display: 'Bricolage Grotesque', 'Bricolage Grotesque fallback', sans-serif
```

`findFallbackFailures` in the `audit` lists a token that skips it.

**Static files, one per weight.** fontaine writes one fallback face per
`@font-face`, copying its weight and style, but sizes every one from the same
metrics — the family's entry in capsize's metrics collection, the regular cut,
for any Google font, else the file it reads — and draws every one in regular
Arial. The 600 and 700 faces carry the regular cut's `size-adjust` over
regular Arial, and a bold line wraps at another width than the font's. Skip the
family in `skipFontFaceGeneration` and write `fallback-faces` with one band per
file: `measure-font` measures each file at its own weight against that one
`size-adjust`, and Arial Bold from `$bold-from` — lower it to `600` when a 600
file measures closer to Arial Bold.

#### `measure-font`

A bin that measures what `fallback-faces` takes and what converting a `ch`
needs, from the font files the app serves — shaped and kerned as Chromium sets
them, a variable file at any weight of its axis:

```bash
pnpm exec measure-font public/fonts/onest-latin.woff2 --weight 400 --weight 700
```

```text
onest-latin.woff2 at 400: zero 0.665em, width ratio 1.023 over Arial
onest-latin.woff2 at 700: zero 0.6602em, width ratio 1.0497 over Arial Bold
cap height from the OS/2 table
size-adjust 1.052039, fontaine's, computed from the first file

@include fonts.fallback-faces('Onest', (ascent: 0.97, descent: 0.305, cap-height: 0.707), 1.052039, (400: 1.023, 700: 1.0497))
```

- List the family's files in the order of its `@font-face` rules, the
  regular first: fontaine measures that one. A static file is measured at its
  own weight; `--weight` (repeated) picks the weights of a variable one.
- Widen each weight of the include to the band it stands for:
  `(300 449: …, 650 800: …)`.
- `--size-adjust` takes the value fontaine wrote in the built CSS. Without it,
  the bin computes fontaine's formula from the first file; fontaine reads a
  Google font from capsize's collection instead, so the two can differ in the
  fourth decimal.
- `--text` or `--text-file` is the app's own text, the more the better; a
  pangram in English and French otherwise. Spaces, tabs and newlines collapse
  to one space as a browser lays them out — a newline measured raw is a glyph
  and widens every ratio —, and a text that is spaces alone is refused.
  Measure it as it shows: uppercase where `text-transform` raises it.
- `--figures` also measures the digits alone and writes `$figures`;
  `--figure-feature` (repeated) names the OpenType features they are set with. `--italic` measures italic files
  over the italic cuts of Arial and writes `$style: italic`; `--bold-from`
  and `--family` match the include. Arial is found where Windows, macOS and
  Linux keep it — Liberation Sans, drawn on Arial's widths, will do —, or
  passed with `--fallback` and `--fallback-bold`.
- **The zero is a `ch`**: a measure given as `46ch` is `46 × zero` em. Read it
  at the weight of the elements that read the measure — a prose column at the
  body weight, not at the heading's.
- **Cap height**: the bin reads it from the `OS/2` table, and from the top of
  the `H` outline when the table has none — an `OS/2` table older than version
  2, where fontaine's `readMetrics` returns `capHeight: null`. That value is
  the one `$trimmed-to-capitals` needs.

### `tokens`

The tokens every app names the same way, so an app sets values, not names.
Include `defaults` first in the app's `:root`; what the app declares after it
wins.

```sass
@use '@adrienlcp/styles/tokens'

@layer tokens
  :root
    @include tokens.defaults
    --gutter: var(--space-l)
```

| Token | Default |
| --- | --- |
| `--stroke-hair`, `--stroke-thin`, `--stroke-bold` | `1px`, `1.5px`, `2px` |
| `--hairline`, `--hairline-strong` | a `--stroke-hair` solid line in `--rule`, `--rule-strong` |
| `--inset-hairline`, `--inset-hairline-strong` | the same line as an inset `box-shadow`, which takes no room |
| `--outline-thick`, `--outline-offset` | `2px`, `3px`. A whole number of pixels: Chromium draws an outline in whole device pixels, so a `2.5px` ring is `2px` on a 1x screen |
| `--ring`, `--ring-offset`, `--ring-inset` | an `--outline-thick` solid outline in `--focus`, drawn `--outline-offset` outside the box or inside it |
| `--underline-offset`, `--tracking-tight` | `0.24em`, `-0.02em` |
| `--icon-s`, `--icon-m`, `--icon-l` | `1rem`, `1.25rem`, `1.5rem` |
| `--target` | `44px`, the smallest touch target |
| `--control-height` | a drawn control's height: `2.75rem`, never below `--target` |
| `--transition-fast`, `--transition-base`, `--transition-slow` | `150ms`, `250ms`, `400ms` — what `reduced-motion.css` collapses |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--measure` | `34em`. Never `ch`: a `ch` is the width of the font's zero, which the fallback face and the web font draw differently, so a column in `ch` rewraps when the web font replaces the fallback |
| `--gutter`, `--gutter-left`, `--gutter-right` | `1rem`; a page's sides padded by `--gutter`, or by the inset a landscape notch covers when it is wider. Set `--gutter` on `:root`, where the pair is computed |
| `--safe-area-top`, `--safe-area-right`, `--safe-area-bottom`, `--safe-area-left` | what the notch, the corners and the home indicator cover under `viewport-fit=cover`, `0px` elsewhere; the bottom reads Android's `safe-area-max-inset-bottom` first. Pad an edge with `max(var(--space-m), var(--safe-area-bottom))` |

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
  in an ancestor that clips. Both take `$on`, a selector that draws the ring
  on a descendant of the focused element — `ring('.track')` for a switch whose
  root takes the focus. `ring-within` rings a box while a field inside it has
  focus, a search box around its input. `ring` and `ring-within` take
  `$offset` for one ring closer than `--ring-offset`. An app on
  `@adrienlcp/react-aria` has the same set in its `focus` module.
- `ring-focusables`, included once at the root of the base layer, rings every
  element that takes focus at zero specificity. It never matches `*`: a
  wrapper that stamps `data-focus-visible` while a control inside holds the
  focus — react-aria's `Group`, a `Select` root — would ring beside it. It
  skips what react-aria's `VisuallyHidden` clips — the input of a `Switch`, a
  `Checkbox`, a `Radio` — since the visible control rings instead.

#### The skip link

```sass
@use '@adrienlcp/styles/accessibility'

.skip-link
  @include accessibility.skip-link
  background: var(--ink)
  color: var(--paper)
  padding: 0 var(--space-s)
```

`skip-link($top: var(--space-2xs), $left: var(--gutter-left), $z-index: 30)`
parks the link above the viewport, `position: fixed`, and slides it in on
`:focus-visible`, so only the keyboard sees it. It shows at
`max($top, var(--safe-area-top))`, below a notch, and is parked past the top
by that offset too, or its bottom would show under the notch. While a view
transition runs it is hidden: the transition's picture of the page would show
it parked. It writes `transition: translate`; a link that also scales on press
writes the whole list itself. The look — background, colour, type, padding,
radius — is the app's.

### `motion`

A page's entrance on the visitor's first landing, and there only: a page
reached through the app appears at once.

```sass
@use '@adrienlcp/styles/motion'

@layer base
  @include motion.keyframes

.page
  @include motion.arriving
```

- `arriving($duration: var(--transition-base), $easing: var(--ease-out), $delay: 0s)`
  fades the element in from `$rise` (`0.5rem`) below, under
  `:root[data-landing]` and `prefers-reduced-motion: no-preference`. It
  animates `opacity` and `translate`, never `transform`, which stays the
  element's own.
- `keyframes` writes the `arriving` keyframes; include it once.
- The shell writes the mark: `<html lang="en" data-landing>`.
  `@adrienlcp/browser`'s `endLanding()` takes it off on the router's first
  navigation, and before a `createRoot` replaces prerendered markup, which
  would otherwise play the entrance twice over the same page.
- `$landing: false` (`@use '@adrienlcp/styles/motion' with ($landing: false)`)
  plays it wherever the element appears, every navigation included.
- It starts at opacity 0, which Chrome does not count as a paint: on a
  prerendered page the largest paint waits for it to end. Keep it on
  `--transition-base`, and off the element that paints the page's largest
  image or block of text.

### `sizes`

Every text size and every spacing is rem, so it follows the font size the user
chose and the zoom. `fluid` lets a display size or a section's spacing grow
with the screen without leaving rem:

```sass
@use '@adrienlcp/styles/sizes'

@layer tokens
  :root
    --text-display: #{sizes.fluid(2rem, 3.5rem)}
    --space-section: #{sizes.fluid(3rem, 6rem)}
```

- `fluid($min, $max, $from: 20rem, $to: 80rem)` returns
  `clamp($min, <rem> + <vw>, $max)`: `$min` up to a `$from`-wide viewport,
  `$max` from `$to`, a straight line between. Every argument is rem, and
  `$max` stays within 2.5 times `$min` — past that, a 200 % zoom on a wide
  screen no longer doubles the size (WCAG 1.4.4). Anything else is a compile
  error.

### `text-box`

A box around one line of text centres its ink, not its line box:

```sass
@use '@adrienlcp/styles/text-box'

.badge
  @include text-box.trimmed-block(var(--space-xs))

.score
  @include text-box.trimmed-figure
```

- `trimmed-block($padding-block)` trims to cap height and baseline and grows
  the padding by `(1lh - 1cap) / 2`, so the box keeps its size. Without
  `text-box`, the plain padding stays.
- `trimmed-figure` trims a numeral on a line of its own; without `text-box` it
  falls back to `line-height: 1`.
- Only a block container is trimmed: wrap a flex item's loose text in a `span`.

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

### `metric-twins`

[fontaine](https://github.com/unjs/fontaine) scales a fallback face to the web
font with `size-adjust` and the `*-override` descriptors, but names one local
font in its `src`: `local("Arial")`. Linux has no Arial and Android only
Roboto, so there the face fails to load, text paints in an unscaled system font
and moves when the web font swaps in. `metricTwins()`, listed after fontaine,
names the fonts drawn on the same metrics too:

```ts
import { metricTwins } from '@adrienlcp/styles/metric-twins'
import fontaine from 'fontaine/postcss'

export default defineConfig({
  css: {
    postcss: { plugins: [fontaine({ fallbacks: ['Arial'] }), metricTwins()] }
  }
})
```

| A face naming | Also names |
| --- | --- |
| `Arial` | `Liberation Sans`, `Arimo`, `Roboto` |
| `Arial Bold` | `Arial-BoldMT`, `Liberation Sans Bold`, `Arimo Bold`, `Roboto Bold` |
| `Arial Italic` | `Arial-ItalicMT`, `Liberation Sans Italic`, `Arimo Italic`, `Roboto Italic` |
| `Arial Bold Italic` | `Arial-BoldItalicMT`, `Liberation Sans Bold Italic`, `Arimo Bold Italic`, `Roboto Bold Italic` |
| `Courier New` | `Liberation Mono`, `Cousine` |
| `Courier New Bold` | `CourierNewPS-BoldMT`, `Liberation Mono Bold`, `Cousine Bold` |
| `Times New Roman` | `Liberation Serif`, `Tinos` |
| `Times New Roman Bold` | `TimesNewRomanPS-BoldMT`, `Liberation Serif Bold`, `Tinos Bold` |

A bold or italic cut is listed by its own names: `local()` matches one face,
by its full or PostScript name, never a family.

- Only a `src` that is one `local()` inside `@font-face` is rewritten, its name
  matched as a browser matches it, ignoring case; a downloaded file or a list
  stays as written, so the plugin never widens a face twice.
- `metricTwins({ twins: { Helvetica: ['Helvetica', 'Arial'] } })` adds a font
  or replaces a default one. `METRIC_TWINS` is the default map;
  `withMetricTwins(src)` is the rewrite on one value.
- The plugin is typed on what it reads, so an app needs no `postcss`
  dependency of its own: Vite brings it.

### `sass-values`

A value a script and a stylesheet both read — a breakpoint a media query and
`matchMedia` answer to — is written once, in TypeScript, and served to Sass as
a module of variables:

```ts
import { sassValues } from '@adrienlcp/styles/sass-values'

export default defineConfig({
  css: { preprocessorOptions: { sass: { importers: [sassValues({ 'screen-sizes': SCREEN_SIZES })] } } }
})
```

```sass
@use 'values:screen-sizes'

.sidebar
  @media (width >= screen-sizes.$wide-screen)
    display: block
```

- `sassValues(modules, { scheme: 'values' })` serves each module at
  `<scheme>:<name>`; a name is kebab case. A camelCase key becomes a kebab-case
  variable: `wideScreen` is `$wide-screen`.
- A number is written as a number; a string as it is, so `'40rem'` is a length
  and `'"Inter"'` a quoted string. A key Sass cannot take, or a string that is
  not one CSS value, throws when the importer is built.
- A module it does not serve, under its scheme, fails the build naming the
  ones it does. Any other URL goes on to the next importer.
- `sass` types the importer; the package lists it as an optional peer.

### `font-metrics`

What `measure-font` runs on, for a script or a test of the app's own:

```ts
import { readFileSync } from 'node:fs'

import { openFont, zeroWidth } from '@adrienlcp/styles/font-metrics'

const font = await openFont(readFileSync('public/fonts/onest-latin.woff2'))
if (font.status === 'success') console.log(`46ch is ${46 * zeroWidth(font.data, 400)}em`)
```

- `openFont(bytes)` reads a `woff2`, `woff`, `ttf` or `otf` file, a `woff2`
  decompressed first, and fails `unreadable` or `collection`.
- `zeroWidth(font, weight?)` is the zero's advance in em; `textWidth(font,
  text, weight?, features?)` the width of a text, shaped and kerned, with the
  OpenType features given (`['tnum', 'lnum']`). A variable file is
  read at `weight` on its `wght` axis, a static file at its own.
- `verticalMetrics(font)` is the ascent and descent from `hhea` and the
  capital height, with `capHeightFrom`: `'OS/2'`, or `'H'` when the table has
  none.
- `fontaineSizeAdjust(font, fallback)` is fontaine's `size-adjust` formula;
  `widthRatio({ font, fallback, sizeAdjust, text, weight })` one `$widths`
  entry.

### `audit`

The rules nobody should have to remember, checked in a test that reads every
stylesheet:

```ts
import { globSync, readFileSync } from 'node:fs'

import { REACT_ARIA_TOKENS } from '@adrienlcp/react-aria'
import {
  findFallbackFailures,
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues,
  webFontFamilies
} from '@adrienlcp/styles/audit'
import { describe, expect, it } from 'vitest'

const STYLESHEETS = globSync('src/**/*.{sass,css}')
const SOURCES = globSync('src/**/*.{sass,css,ts,tsx}').map((path) => readFileSync(path, 'utf8'))
const WEB_FONTS = webFontFamilies(STYLESHEETS.map((path) => readFileSync(path, 'utf8')))

describe.each(STYLESHEETS)('%s', (path) => {
  const stylesheet = readFileSync(path, 'utf8')

  it('sizes text, spacing and boxes in rem', () => {
    expect(findUnitFailures(stylesheet)).toEqual([])
  })

  it.skipIf(path.endsWith('_typography.sass'))('takes its text voice from the typography mixins', () => {
    expect(findTypeLiterals(stylesheet)).toEqual([])
  })

  it('takes its radii and durations from tokens', () => {
    expect(findUnnamedValues(stylesheet)).toEqual([])
  })

  it('names the fallback face after every web font in a font token', () => {
    expect(findFallbackFailures(stylesheet, WEB_FONTS)).toEqual([])
  })
})

it('reads only custom properties that exist, under their one shared name', () => {
  expect(findTokenFailures(SOURCES, { provided: REACT_ARIA_TOKENS })).toEqual([])
})
```

`REACT_ARIA_TOKENS` comes from `@adrienlcp/react-aria`; an app without
react-aria leaves the options out.

- Comments are never read, in a stylesheet or a script; a `//` inside a string
  or a `url()` is no comment.
- `findUnitFailures` reads `font-size`, `font`, `margin*`, `padding*`, the
  gaps, `text-indent`, `width`, `height` and their logical, `min-` and `max-`
  forms, `inset*`, `top`, `right`, `bottom`, `left`, `translate`, `flex-basis`,
  the `translate*()` functions of a `transform`, and every custom property. A
  failure is `pixels` — any non-zero `px` value there, `clamp()` bounds and
  `calc()` terms included — or `viewport-without-rem`: a
  text size driven by `vw`, `vh`, `vmin` or a container unit with no rem part,
  which zoom cannot enlarge. It also lists `ch`, a size or a custom property
  in `ch` — the width of the font's zero, which moves when the web font
  replaces the fallback —, and `fractional-outline`, an `outline`,
  `outline-width` or `--outline-*` width (the offset aside) that is not a
  whole number of pixels. Strokes, outlines, radii, shadows and the touch
  target stay in px: their properties and their `--stroke-*`, `--outline-*`,
  `--radius-*`, `--shadow-*` and `--target` tokens are not read. A
  surface sized on the viewport — a scoreboard on a TV — derives its sizes from
  a named unit token (`calc(var(--cu) * 4)`), which passes.
- `findTypeLiterals` lists every `font-weight`, `line-height` and
  `letter-spacing` written as a number or a keyword: a text voice is declared
  once, in a mixin, and a component includes it. `inherit` and `var()` pass.
- `findUnnamedValues` lists a radius (`radius`), a transition or animation
  duration or delay (`duration`) or a `font-size` (`text-size`) written as a
  literal: a radius is a `--radius-*` token, a duration is written over
  `--transition-*`, which `reduced-motion.css` collapses, a text size is a
  `--text-*` step. `0` and `0s` pass; a font size passes when it reads a
  `var()` — a fitted floor `max(var(--text-s), 7cqi)`, a unit token
  `calc(var(--cu) * 4)` —, keeps the parent's size (`1em`, `100%`) or is a
  keyword.
- `webFontFamilies` reads the families the stylesheets self-host: every
  `fonts.font-face` include and every `@font-face` with a `url()` source. A
  family loaded elsewhere — a `@fontsource` import — is added by hand.
- `findFallbackFailures` lists a custom property whose font stack names one of
  those web fonts without `'<family> fallback'` right after it
  (`missing-fallback`, with the `family`): fontaine appends its fallback face
  to a `font-family` declaration, never inside a custom property, so the
  token paints in an unscaled system font until the font arrives — for good
  under `font-display: optional` when it misses. A web font listed after a
  fallback face is a glyph backup the fallback always shadows, and passes.
- `findTokenFailures` takes every source — stylesheets and the scripts that
  set a property through `style` — and lists a name read through `var()` but
  declared nowhere, not shared and not `provided` (`undeclared`: a rename
  without an alias); a second size in a family the shared set holds in one
  (`parallel`: a `--control-*`, `--outline-*`, `--ring-*` or `--target-*` name
  whose suffix is a size step or a size word — `--control-m`,
  `--control-touch`, `--outline-thin` — or whose value is a bare length; a
  derived `--target-reach` or a colour `--control-ink` passes); and a second
  name for a shared value (`alias`: `--timing: cubic-bezier(0.16, 1, 0.3, 1)`
  is `--ease-out`), compared only on values with a space, a comma or a
  function. A name built by interpolation — `--g#{$n}`, `--pawn-${n}` — is not
  read. `SHARED_TOKENS` lists the names that pass undeclared;
  `SHARED_TOKEN_DEFAULTS` maps each `defaults` token to its value.
