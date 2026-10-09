# @adrienlcp/measure-font

## 0.1.0

### Minor Changes

- `measure-font` moves out of `@adrienlcp/styles` into `@adrienlcp/measure-font`, a dev dependency: fontkit, wawoff2 and capsize no longer reach an app's runtime dependencies, and `@adrienlcp/styles/font-metrics` becomes `@adrienlcp/measure-font`, with `textWidth` and `zeroWidth` taking a `{ weight, axes, features }` style. The bin measures the `unicode-range` subsets of one face as one font and refuses a face that draws none of the text, refuses a `--figure-feature` the file lacks, reads another axis with `--axis wdth=70`, reads the text from i18n dictionaries (`--text-from`) and prerendered pages (`--text-from-dist`, `--select`, `--uppercase`), gives the ratio range that keeps each edge line of a `--lines` file wrapped as the web font wraps it, measures the digits alone with `--figures-only` and their separators with `--figure-separators`, takes `--ascent` and `--descent` by hand, and warns about the default pangram, digits far off the letters and `USE_TYPO_METRICS`.

### Patch Changes

- e38bb13: Drop branches no input could reach: the font audit reads its regular expression captures by destructuring, `measure-font` checks its number options in one pass, a dictionary translation's options are read as the map they always are, and the prerender's `replaceFormatted` takes at least one node.
