---
'@adrienlcp/i18n': minor
---

Add the locale in the URL: `localeInPath`, `pathInLocale` and `localizedPathFor` read and move the locale kept as a path's first segment, and `applyInitialLocale` picks the locale an app opens on — the URL, then the stored choice, then the browser — and stamps it on `<html lang>`. Storage stays with the caller, through a reader and a writer.
