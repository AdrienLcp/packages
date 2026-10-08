---
"@adrienlcp/react-aria": patch
"@adrienlcp/styles": patch
---

`ring-focusables` skips what react-aria's `VisuallyHidden` clips — the input under a `Switch`, a `Checkbox`, a `Radio` — and what sits inside it, so the hidden input no longer draws a ring beside the visible control.
