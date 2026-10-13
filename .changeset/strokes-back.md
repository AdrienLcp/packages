---
'@adrienlcp/styles': minor
---

Strokes back to `--stroke-thin: 1.5px` and `--stroke-bold: 2px` (`--stroke-hair` stays `1px`): the whole-pixel `2px` and `3px` of 0.18 read heavy on the high-density screens the apps are read on. The `fractional-stroke` failure of `findUnitFailures` is gone with them — a border and a `--stroke-*` may be a fraction of a pixel. An outline stays whole (`fractional-outline`).
