---
"@adrienlcp/i18n": minor
---

A translator can take its formats from another locale than its language: `createTranslator({ dictionary, locale, formatLocale })`, `i18n.translator(locale, formatLocale?)` and `i18n.load(locale, formatLocale?)`, where `formatLocale` is a tag or a preference list such as `navigator.languages` (exported as `FormatLocale`). Numbers, a plural's `{?}` and numeric dates follow it; anything written in words — a month or weekday name, a spelled-out number, the plural form chosen, a list, a relative time, a display name — stays in the language, and a date in words takes only its hour cycle from `formatLocale` unless the dictionary sets one. Left out, it is the language's locale, as before. The registry keeps one translator per locale and format locale, and one fetch per locale whatever the format locale.
