---
'@adrienlcp/react-aria': patch
---

The sheet's scrim now reaches the screen's edge on a page with `scrollbar-gutter: stable`. A fixed element never paints over a reserved scrollbar gutter, and Chromium sizes `100vw` without it, so a bright strip was left down the scrim's side on a desktop browser in a narrow window. While the sheet is up, the gutter becomes padding on the root: the page keeps its width and the scrim covers it all.
