---
"@adrienlcp/browser": minor
"@adrienlcp/prerender": minor
"@adrienlcp/styles": minor
---

browser: `readDurationSeconds` reads a `<time>` custom property as seconds, and `endLanding` takes the shell's `data-landing` mark off once the visitor has landed.

prerender: `addCanonical` for a shell written without a canonical link; `setRootAttributes` and `insertScriptAfterRoot` for a guard that runs as soon as the root is parsed; `writeModulePreloads` to choose a page's modulepreload links; `addFontPreloads` takes `'none'` or several patterns in the order to ask for them, and goes ahead of any other preload; `readShell`, `readInputFile` and `readInputJson` name a missing input file and the step that writes it; every tag added to the head is indented like the shell's; a `client` entry with `startAppAfterFirstPaint` and `capturePrerenderedText`, which finds where the app's first render changed the prerendered text.

styles: an `accessibility.skip-link` mixin that clears the safe area, a `motion` module whose `arriving` plays an entrance on the first landing only, and a `sass-values` importer that serves values written in TypeScript — a breakpoint scripts read too — as a Sass module.
