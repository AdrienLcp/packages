---
"@adrienlcp/styles": minor
---

Add `sizes` and `units`: `sizes.fluid($min, $max)` writes a rem size that grows with the viewport and refuses a range a 200 % zoom could not double, `sizes.rem(14px)` converts a design file's pixels, and `findUnitFailures(stylesheet)` lists every text size or spacing in `px`, and every text size driven by the viewport with no rem part
