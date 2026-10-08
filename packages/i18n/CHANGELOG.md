# @adrienlcp/i18n

## 0.5.2

### Patch Changes

- 9e6aae9: Document loading a dictionary before the first render, for a page prerendered in a locale that is loaded on demand: a first frame in the default locale would fail to hydrate.

## 0.5.1

### Patch Changes

- ffdaf08: Keep Web Dev Simplified's copyright notice in the license, as its MIT license requires
- 5e76b8b: Point each package homepage to its entry on adrienlcp.com

## 0.5.0

### Minor Changes

- 0b2a66c: `i18n.load(locale, { formatLocale, signal })` takes its options as an object — `formatLocale` moves there from the second argument — and accepts an `AbortSignal`: an aborted caller rejects alone with `signal.reason` while the others keep waiting on the shared fetch. Loaders receive `{ signal }`, aborted only once every waiting caller has aborted, and `isAbortError` tells an abort from a failure.

## 0.4.0

### Minor Changes

- b1d4500: A translator can take its formats from another locale than its language: `createTranslator({ dictionary, locale, formatLocale })`, `i18n.translator(locale, formatLocale?)` and `i18n.load(locale, formatLocale?)`, where `formatLocale` is a tag or a preference list such as `navigator.languages` (exported as `FormatLocale`). Numbers, a plural's `{?}` and numeric dates follow it; anything written in words — a month or weekday name, a spelled-out number, the plural form chosen, a list, a relative time, a display name — stays in the language, and a date in words takes only its hour cycle from `formatLocale` unless the dictionary sets one. Left out, it is the language's locale, as before. The registry keeps one translator per locale and format locale, and one fetch per locale whatever the format locale.

## 0.3.0

### Minor Changes

- b5eca24: `{x:date}` now also takes a `Temporal.ZonedDateTime`, added to `FormattableDate`. It is shown in its own time zone, as its `toLocaleString` would, whatever the `timeZone` option says; a calendar other than `iso8601` must be the formatter's, or the placeholder stays standing. Every Temporal value still reaches `Intl.DateTimeFormat` as itself, never through a `Date`.

## 0.2.0

### Minor Changes

- e6ed7d1: `{x:date}` now also takes a `Temporal.Instant`, `Temporal.PlainDate`, `Temporal.PlainDateTime` or `Temporal.PlainTime`, typed through the new `FormattableDate`. An `Instant` is shown in the `timeZone` option; a `Plain*` value keeps its own wall clock. A `ZonedDateTime`, `PlainYearMonth` or `PlainMonthDay` is refused at compile time and left standing at runtime, as are options asking for fields the value lacks. A project compiling without Temporal in its `lib`, or running without a `Temporal` global, keeps taking a `Date` alone.

## 0.1.2

### Patch Changes

- be261dc: An invalid `Date`, a count that is not finite given to `{x:relative}`, or a string that is no code given to `{x:displayname}` now leaves its placeholder standing instead of throwing out of the whole translation.

## 0.1.1

### Patch Changes

- 152b3c0: `createI18n` refuses a `defaultLocale` typed as a union of locales (`const DEFAULT_LOCALE: Locale = 'en'`). Such a value made the reference dictionary every locale's at once, so keys with placeholders resolved to `never` at the call site; the error now shows up at `defaultLocale` and says how to declare it.

  The `DictionaryFor` documentation now says it is for `createTranslator` only: a locale registered with `createI18n` is written through `defineDictionary`.
