---
'@adrienlcp/styles': minor
---

`measure-font` and `@adrienlcp/styles/font-metrics` move to `@adrienlcp/measure-font`, a dev dependency: fontkit, wawoff2 and capsize no longer reach an app's runtime dependencies. `fonts.fallback-faces` takes `$figures` as one ratio for every band, `$figure-separators` to draw `: . ,` in the figures face, `$stretch` for a width band, and `$size-adjust` defaults to `1` with `$widths` passed by name; a figures face now draws the line box of its band's letters under `$trimmed-to-capitals` instead of its own.

Read every face the audit can resolve — a family in a variable, a family drawn only by `fallback-faces`, a family passed to a face mixin of the app's own — and fail loudly on the rest with `findUnreadFontFaces`; check fallback bands against the weights and styles the stylesheets set with `findFallbackBandFailures`; flag a family named in SVG or JSX instead of a font token with `findFontAttributeFailures`; read grid tracks in `findUnitFailures`, let a `--*-px` custom property hold pixels a script must match, and flag a fractional border or shared stroke (`fractional-stroke`); flag a raw `env(safe-area-inset-*)` and a hand-written side `max()` pair in `findUnnamedValues`. `--stroke-thin` and `--stroke-bold` default to `2px` and `3px`, whole pixels like the hairline: a `1.5px` stroke is the hairline on a 1x screen.

An `accessibility.skip-link` mixin that clears the safe area, a `motion` module whose `arriving` plays an entrance on the first landing only, and a `sass-values` importer that serves values written in TypeScript — a breakpoint scripts read too — as a Sass module.
