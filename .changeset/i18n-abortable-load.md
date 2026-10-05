---
"@adrienlcp/i18n": minor
---

`i18n.load(locale, { formatLocale, signal })` takes its options as an object — `formatLocale` moves there from the second argument — and accepts an `AbortSignal`: an aborted caller rejects alone with `signal.reason` while the others keep waiting on the shared fetch. Loaders receive `{ signal }`, aborted only once every waiting caller has aborted, and `isAbortError` tells an abort from a failure.
