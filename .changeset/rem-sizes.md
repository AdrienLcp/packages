---
"@adrienlcp/styles": minor
---

Add `sizes` and `audit`: `sizes.fluid($min, $max)` writes a rem size that grows with the viewport and refuses a range a 200 % zoom could not double, `sizes.rem(14px)` converts a design file's pixels, `findUnitFailures(stylesheet)` lists every text size or spacing in `px` and every text size driven by the viewport with no rem part, and `findTypeLiterals(stylesheet)` every weight, leading or tracking written outside the typography mixins. `text-box` adds `trimmed-block($padding)` and `trimmed-figure`, which centre a one-line label on its ink. `tokens.defaults` adds `--icon-s`, `--icon-m` and `--icon-l`. `reset.css` keeps `[hidden]` hidden over a component's `display`, scrolls anchors to `--scroll-offset`, breaks long words in headings and paragraphs, balances `h5` and `h6`, smooths fonts on macOS Firefox and resizes a textarea only vertically. `reduced-motion.css` ends every keyframe animation at once
