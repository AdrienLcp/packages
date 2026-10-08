---
"@adrienlcp/styles": minor
---

The audit reads what apps actually write. `findUnitFailures` also catches a `px` inside a `transform`'s `translate*()` and lets a zero pass in any unit. `findUnnamedValues` flags a `font-size` written as a literal (`text-size`). `findTokenFailures` skips comments and interpolated names (`--g#{$n}`, `--pawn-${n}`), takes `{ provided }` for names a library sets at runtime, narrows `parallel` to a size step, a size word or a bare length (so `--target-reach` and `--control-ink` pass), and adds `alias`: a second name for a distinctive `defaults` value, such as `--timing` holding `--ease-out`. `SHARED_TOKEN_DEFAULTS` maps each default token to its value. `tokens.defaults` declares `--safe-area-top`, `--safe-area-right`, `--safe-area-bottom` and `--safe-area-left`. `reset.css` documents its one `!important` for Biome.
