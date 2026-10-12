---
'@adrienlcp/prerender': minor
---

Keep in the package only what two projects use. Removed:

- `@adrienlcp/prerender/client` — `startAppAfterFirstPaint`, `capturePrerenderedText`, `textNodesOf`, `PrerenderedTextMismatch` — and `writeModulePreloads`: no project used them.
- `addCanonical`, `setRootAttributes`, `insertScriptAfterRoot` and `readShell`: moved into on-record, their one user; `readInputJson` is no longer exported either, and on-record keeps its own copy.
- `noindexShell`: moved into portfolio, its one user.
- `setTitle`, `setMeta`, `onlyElement`, `createElement`, `insertIntoHead`, `ENTRY_SCRIPT`, `readInputFile` and, from `@adrienlcp/prerender/vite`, `shellHeadTransform` are no longer exported: the public helpers use them as before.

`BuildManifest`, `BuildChunk`, `FontPreloadSelection` and `LanguageVersion` stay exported: they type the remaining helpers.
