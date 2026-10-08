---
'@adrienlcp/styles': minor
---

`fonts.font-face` defaults to `font-display: optional` instead of `swap`: a font that misses the first ~100 ms stays out until the next page, so it never swaps in under a reader and shifts the layout. Pass `$display: swap` to keep the old behaviour.
