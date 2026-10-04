# @adrienlcp/i18n

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
