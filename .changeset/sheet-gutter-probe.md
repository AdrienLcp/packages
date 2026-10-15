---
'@adrienlcp/react-aria': patch
---

The sheet's scrim reaches the screen's edge on a page too short to scroll as well: the gutter is measured as the window's width less the viewport a fixed element fills, since Chromium's root `clientWidth` counts a stable gutter only while a scrollbar shows in it. A fractional gutter no longer leaves its padding on the root once the sheet is put away.
