---
'@adrienlcp/react-aria': patch
---

The sheet's scrim reaches the screen's edge in Chromium: the gutter is measured before react-aria's scroll lock and released after it. Measured after, with the overflow hidden, the root's `clientWidth` no longer counted the gutter's room and nothing was released.
