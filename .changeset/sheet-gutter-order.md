---
'@adrienlcp/react-aria': patch
---

The sheet's scrim reaches the screen's edge in a browser too, not only under test: the gutter is released after react-aria's scroll lock rather than before it, which found the page's scrollbar still showing and reserved its room again, so the page moved sideways by half a scrollbar and the strip stayed.
