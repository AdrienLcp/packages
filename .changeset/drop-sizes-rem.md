---
'@adrienlcp/styles': minor
---

Remove `sizes.rem()`: write a size in rem directly, or take it from a token, and `findUnitFailures` flags a `px` text size or spacing again wherever it is written. `tokens.defaults` renames `--control-touch` to `--control-height`, a drawn control's height at `2.75rem` that never falls below `--target`. `ring` and `ring-inset` take `$on`, a selector that draws the ring on a descendant of the focused element, and `ring-within` rings a box while a field inside it has focus
