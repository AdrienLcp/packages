---
'@adrienlcp/i18n': minor
---

Stop exporting what no project imports: `createTranslator`, `negotiateLocale` and `isAbortError` stay inside the package, behind `createI18n`. A caller that aborts `load` tells an abort from a failure by its own `signal.aborted`. Every type stays exported.
