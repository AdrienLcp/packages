---
'@adrienlcp/react-aria': minor
---

`PopoverSheet` opens a popover beside its trigger on a screen that answers `wideQuery`, and below it a sheet rising from the bottom edge, which `SheetGrabber` pulls down past a quarter of its height or on a flick. The `sheet` Sass module ships the overlay, the sheet, the grabber and their keyframes; the look stays the app's. The sheet is a `Modal` with its own rise rather than react-aria's `Sheet`, whose smooth-scroll entrance no stylesheet can shorten.
