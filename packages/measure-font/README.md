# @adrienlcp/measure-font

A dev-time bin that measures a self-hosted font against Arial for the
`fonts.fallback-faces` mixin of [`@adrienlcp/styles`](../styles), and converts
a `ch` to em — from the font files the app serves, shaped and kerned as
Chromium sets them, a variable file at any weight and width of its axes.

```bash
pnpm add -D @adrienlcp/measure-font
```

A dev dependency: it reads fonts with fontkit, wawoff2, capsize and linkedom,
which an app's runtime never needs. It writes includes for
`@adrienlcp/styles` 0.18 and later.

## `measure-font`

```bash
pnpm exec measure-font public/fonts/onest-latin.woff2 public/fonts/onest-latin-ext.woff2 --weight 400 --weight 700 --text-from-dist dist
```

```text
onest-latin.woff2 + onest-latin-ext.woff2 at 400: zero 0.665em, width ratio 1.023 over Arial
onest-latin.woff2 + onest-latin-ext.woff2 at 700: zero 0.6602em, width ratio 1.0497 over Arial Bold
cap height from the OS/2 table
size-adjust 1.052039, fontaine's, computed from the first file

@include fonts.fallback-faces('Onest', (ascent: 0.97, descent: 0.305, cap-height: 0.707), 1.052039, (400: 1.023, 700: 1.0497))
```

Warnings go to stderr, prefixed `warning:`; the report and the include to
stdout.

### The files

- List the family's files in the order of its `@font-face` rules, the
  regular first: fontaine measures that one. A static file is measured at its
  own weight; `--weight` (repeated) picks the weights of a variable one.
  Widen each weight of the include to the band it stands for:
  `(300 449: …, 650 800: …)`.
- **The `unicode-range` subsets of one face are one font.** Files of one
  family, style, weight and axes — `latin` and `latin-ext` — are measured as a
  browser draws them: each character from the first subset that has it. A
  face that draws none of the text is refused: list a `latin-ext` file after
  its `latin` one, never alone. A character no file draws is left out of both
  widths and listed — the next font of the stack draws it in either face.
- `--axis wdth=70` reads another axis of a variable file, and writes
  `$stretch: 70%`: one run per width band the app sets, each widened to its
  band of stretches (`$stretch: 62% 70%`). A face without that axis is
  refused.
- `--italic` measures italic files over the italic cuts of Arial and writes
  `$style: italic`. Two faces at one weight — two families, or two styles —
  are refused: one family in one style per run.
- Arial is found where Windows, macOS and Linux keep it — Liberation Sans,
  drawn on Arial's widths, will do —, or passed with `--fallback` and
  `--fallback-bold`; `--bold-from` (`650`) and `--family` match the include.

### The text

Measure the app's own text, as it shows. Every source given is read, one
after the other; without any, a pangram in English and French, whose ratios
say how the font stands to Arial in general — a warning says so.

- `--text <text>` and `--text-file <path>`, repeated. Spaces, tabs and
  newlines collapse to one space as a browser lays them out — a newline
  measured raw is a glyph and widens every ratio —, and a text that is spaces
  alone is refused.
- `--text-from <path>` reads an i18n dictionary: a `.json` tree, or a `.ts` or
  `.js` module Node imports, its default export or else every export. Every
  string leaf is a message; an `@adrienlcp/i18n` `defineTranslation` gives
  its message, its plural forms and its enum members. `{placeholders}` and
  `<tags>` are left out: their values are the app's.
- `--text-from-dist <dir>` reads every prerendered `.html` page under a
  directory — the body's text nodes, without scripts, styles, templates and
  `noscript`. `--select 'h1, h2'` reads only the elements a selector matches,
  for the text set at one weight.
- `--uppercase` measures it as `text-transform: uppercase` shows it.
- **One band, one text.** A weight band is best measured over the text set in
  it: run once per band — `--weight 700 --text-from-dist dist --select 'h1, h2'
  --uppercase` — and gather the entries in one include.

### The ratio range of edge lines

A mean ratio keeps most lines; the one that fills its box to a few pixels
wants its own. `--lines <path>` reads those lines:

```json
[
  { "text": "Print the family sheet", "box": 327, "fontSize": 16, "weight": 400 },
  { "text": "COLOR DOTS", "box": 288, "fontSize": 48, "weight": 800, "letterSpacing": -0.02 }
]
```

- `box` is the content width the line is laid out in and `fontSize` its font
  size, both in px as DevTools shows them; `letterSpacing` is in em; `weight`
  defaults to the first weight measured, and a weight not measured is
  refused. Write the text as it shows — uppercased where it is.
- Each line the web font fits must fit the fallback, and each it wraps must
  wrap there too. The report gives the range per band —
  `1.0041 ≤ ratio < 1.0091 keeps its 3 lines wrapped as the web font wraps
  them` — and the include writes the text's ratio when it is inside, else the
  nearest value that is, with up to six decimals for a narrow range.
- When no ratio keeps every line, the report names the two lines in conflict
  and the include keeps the text's ratio.

### The digits

- `--figures` also measures the digits alone and writes `$figures`, once for
  every band when every weight gives the same ratio (within 0.1 %).
  `--figure-feature` (repeated) names the OpenType features they are set
  with: `tnum` and `lnum` for `tabular-nums lining-nums`. **A file without
  one is refused** — a browser sets its digits without it, so the measure
  would describe figures the page never shows. `tnum` passes on a file whose
  digits already share one advance.
- `--figure-separators` measures `: . ,` with the digits and writes
  `$figure-separators: true`.
- `--figures-only` measures the digits alone and prints the `$figures`
  argument alone, to add to an include written before: the letter ratios over
  the default pangram are not corrections to apply.
- A warning says when, at some weight, the digits stand more than 10 % off
  the letters: a figures face is owed, or — with `--figures` — something in the
  measure deserves a second look.
- A monospace family needs no `$figures`: its digits are as wide as its
  letters.

### The metrics

- **`--size-adjust`** takes the value fontaine wrote in the built CSS.
  Without it, the bin computes fontaine's formula from the first file;
  fontaine reads a Google font from capsize's collection instead, so the two
  can differ in the fourth decimal. The value only sets the scale the ratios
  are read on: `--size-adjust 1` leaves it to the mixin's default and writes
  `$widths:` by name.
- **`--ascent` and `--descent`** replace the `hhea` metrics in the include. A
  font that sets `USE_TYPO_METRICS` draws its line box from its `OS/2` typo
  metrics in a browser that honours the flag; the bin warns and prints them.
- **Cap height**: read from the `OS/2` table, and from the top of the `H`
  outline when the table has none — an `OS/2` table older than version 2,
  where fontaine's `readMetrics` returns `capHeight: null`. That value is the
  one `$trimmed-to-capitals` needs.
- **The zero is a `ch`**: a measure given as `46ch` is `46 × zero` em. Read it
  at the weight of the elements that read the measure — a prose column at the
  body weight, not at the heading's.

## The library

What the bin runs on, for a script or a test of the app's own:

```ts
import { readFileSync } from 'node:fs'

import { openFont, zeroWidth } from '@adrienlcp/measure-font'

const font = await openFont(readFileSync('public/fonts/onest-latin.woff2'))
if (font.status === 'success') console.log(`46ch is ${46 * zeroWidth(font.data, { weight: 400 })}em`)
```

- `openFont(bytes)` reads a `woff2`, `woff`, `ttf` or `otf` file, a `woff2`
  decompressed first, and fails `unreadable` or `collection`. `axes` holds
  every axis of a variable file, `weightAxis` its `wght`.
- `zeroWidth(font, variation?)` is the zero's advance in em; `textWidth(font,
  text, style?)` the width of a text, shaped and kerned. A variation is
  `{ weight, axes: { wdth: 70 } }`, read on the axes the file has; a style
  adds `features: ['tnum', 'lnum']`. `atVariation` is the fontkit font at a
  variation.
- `missingFeatures(font, features)` lists the OpenType features the file
  holds no lookup for.
- `verticalMetrics(font)` is the ascent and descent from `hhea` and the
  capital height, with `capHeightFrom`: `'OS/2'`, or `'H'` when the table has
  none, and `typo`: the typo metrics when `USE_TYPO_METRICS` makes them the
  ones a browser may use.
- `fontaineSizeAdjust(font, fallback)` is fontaine's `size-adjust` formula.

