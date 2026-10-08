---
"@adrienlcp/i18n": patch
---

Document loading a dictionary before the first render, for a page prerendered in a locale that is loaded on demand: a first frame in the default locale would fail to hydrate.
