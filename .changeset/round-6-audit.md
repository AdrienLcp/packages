---
'@adrienlcp/styles': minor
---

Read every face the audit can resolve — a family in a variable, a family drawn only by `fallback-faces`, a family passed to a face mixin of the app's own — and fail loudly on the rest with `findUnreadFontFaces`; check fallback bands against the weights and styles the stylesheets set with `findFallbackBandFailures`; flag a family named in SVG or JSX instead of a font token with `findFontAttributeFailures`; read grid tracks in `findUnitFailures`, let a `--*-px` custom property hold pixels a script must match, and flag a fractional border or shared stroke (`fractional-stroke`); flag a raw `env(safe-area-inset-*)` and a hand-written side `max()` pair in `findUnnamedValues`. `--stroke-thin` and `--stroke-bold` default to `2px` and `3px`, whole pixels like the hairline: a `1.5px` stroke is the hairline on a 1x screen.
