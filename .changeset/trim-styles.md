---
'@adrienlcp/styles': minor
---

Keep in the package only what two projects use. Removed:

- `@adrienlcp/styles/motion` — `arriving`, `keyframes`, `$landing`, `$rise` — and the `--inset-hairline-strong` token: no project used them.
- `@adrienlcp/styles/sass-values` (`sassValues`, `SassModuleValues`): moved into arbor.
- `@adrienlcp/styles/spread` (`columns`): moved into sport.
- `@adrienlcp/styles/text-box` (`trimmed-block`, `trimmed-figure`): moved into taverla.
- `ring`, `ring-inset`, `ring-within` and `ring-focusables` from `@adrienlcp/styles/accessibility`: moved into sport; every other app rings through `@adrienlcp/react-aria/focus`. The `--ring-inset` token, which only `ring-inset` read, goes with them.
- No longer exported: `SHARED_TOKENS` and `SHARED_TOKEN_DEFAULTS` from `audit`, `METRIC_TWINS` and `withMetricTwins` from `metric-twins`, and `fonts`' `$arial-cap-height`, `$arial-cuts`, `$digits` and `$figures-and-separators`, now private. The audit and the mixins read them as before.
