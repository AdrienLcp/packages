---
"@adrienlcp/measure-font": patch
"@adrienlcp/prerender": patch
"@adrienlcp/styles": patch
---

Drop branches no input could reach: the font audit reads its regular expression captures by destructuring, `measure-font` checks its number options in one pass, a dictionary translation's options are read as the map they always are, and the prerender's `replaceFormatted` takes at least one node.
