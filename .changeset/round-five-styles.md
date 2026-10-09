---
"@adrienlcp/styles": minor
---

`fonts.fallback-faces` takes `$figures`, the digits' own ratio per band, and writes a face for `U+0030-0039` alone after each band: tabular figures no longer set narrower or wider in the fallback than the web font. `measure-font --figures` measures them, with `--figure-feature tnum` for the features they are set with, and `textWidth` takes those features. `measure-font` collapses the spaces and newlines of `--text` and `--text-file` as a browser lays them out — a raw newline widened every ratio by about 2 % — and refuses a text that is spaces alone instead of printing `NaN`.
