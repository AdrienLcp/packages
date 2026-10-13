# @adrienlcp/prerender

## 0.3.0

### Minor Changes

- 60de920: Keep in the package only what two projects use. Removed:
  
  - `@adrienlcp/prerender/client` — `startAppAfterFirstPaint`, `capturePrerenderedText`, `textNodesOf`, `PrerenderedTextMismatch` — and `writeModulePreloads`: no project used them.
  - `addCanonical`, `setRootAttributes`, `insertScriptAfterRoot` and `readShell`: moved into on-record, their one user; `readInputJson` is no longer exported either, and on-record keeps its own copy.
  - `noindexShell`: moved into portfolio, its one user.
  - `setTitle`, `setMeta`, `onlyElement`, `createElement`, `insertIntoHead`, `ENTRY_SCRIPT`, `readInputFile` and, from `@adrienlcp/prerender/vite`, `shellHeadTransform` are no longer exported: the public helpers use them as before.
  
  `BuildManifest`, `BuildChunk`, `FontPreloadSelection` and `LanguageVersion` stay exported: they type the remaining helpers.

## 0.2.0

### Minor Changes

- `addCanonical` for a shell written without a canonical link; `setRootAttributes` and `insertScriptAfterRoot` for a guard that runs as soon as the root is parsed; `writeModulePreloads` to choose a page's modulepreload links; `addFontPreloads` takes `'none'` or several patterns in the order to ask for them, and goes ahead of any other preload; `readShell`, `readInputFile` and `readInputJson` name a missing input file and the step that writes it; every tag added to the head is indented like the shell's; a `client` entry with `startAppAfterFirstPaint` and `capturePrerenderedText`, which finds where the app's first render changed the prerendered text.

### Patch Changes

- e38bb13: Drop branches no input could reach: the font audit reads its regular expression captures by destructuring, `measure-font` checks its number options in one pass, a dictionary translation's options are read as the map they always are, and the prerender's `replaceFormatted` takes at least one node.

## 0.1.0

### Minor Changes

- 6d4afb4: First release: build-time helpers that write one prerendered document per page from a Vite app's shell, and a Vite plugin that fills the shell's head.
