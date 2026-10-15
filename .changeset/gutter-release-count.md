---
'@adrienlcp/react-aria': patch
---

`ScrollbarGutterRelease` holds from an overlay's opening to its closing, as react-aria's scroll lock does, rather than through its exit, where the padding narrowed the page for the length of the fade. Overlays open together share one release, made afresh at each opening: a modal opened from a sheet, which opens as the sheet closes, kept a gutter's width of padding on the root once both were gone.
