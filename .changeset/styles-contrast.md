---
"@adrienlcp/styles": minor
---

Add `contrast`: `findContrastFailures(stylesheet, pairs)` reads the colour tokens a stylesheet declares, follows `var()` and `light-dark()`, and lists every pair under its WCAG minimum in either scheme, so a test fails before a low-contrast palette ships. `WCAG_AA` holds the level AA ratios
