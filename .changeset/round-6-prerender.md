---
'@adrienlcp/prerender': minor
---

`addCanonical` for a shell written without a canonical link; `setRootAttributes` and `insertScriptAfterRoot` for a guard that runs as soon as the root is parsed; `writeModulePreloads` to choose a page's modulepreload links; `addFontPreloads` takes `'none'` or several patterns in the order to ask for them, and goes ahead of any other preload; `readShell`, `readInputFile` and `readInputJson` name a missing input file and the step that writes it; every tag added to the head is indented like the shell's; a `client` entry with `startAppAfterFirstPaint` and `capturePrerenderedText`, which finds where the app's first render changed the prerendered text.
